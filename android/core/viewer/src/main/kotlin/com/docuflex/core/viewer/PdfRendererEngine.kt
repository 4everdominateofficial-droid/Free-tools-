package com.docuflex.core.viewer

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException

/**
 * Native Android PdfRenderer wrapper with safe memory constraints.
 * Features:
 * 1. Single-page bitmap allocation to avoid OutOfMemory.
 * 2. Explicit bitmap recycling.
 * 3. Graceful handling of password-protected documents (which platform PdfRenderer cannot decrypt).
 * 4. Scale clamping to prevent multi-megapixel memory blowouts.
 */
class PdfRendererEngine(private val context: Context) : AutoCloseable {

    private var fileDescriptor: ParcelFileDescriptor? = null
    private var pdfRenderer: PdfRenderer? = null
    private var currentActivePage: PdfRenderer.Page? = null
    private var lastRenderedBitmap: Bitmap? = null

    var pageCount: Int = 0
        private set

    /**
     * Initializes the PDF renderer from a SAF Uri.
     */
    suspend fun open(uri: Uri): Result<Int> = withContext(Dispatchers.IO) {
        try {
            close() // release any prior session
            val pfd = context.contentResolver.openFileDescriptor(uri, "r")
                ?: return@withContext Result.failure(IOException("Could not obtain file descriptor for Uri"))
            fileDescriptor = pfd
            
            val renderer = PdfRenderer(pfd)
            pdfRenderer = renderer
            pageCount = renderer.pageCount
            Result.success(pageCount)
        } catch (e: SecurityException) {
            Result.failure(SecurityException("Password-protected PDF cannot be rendered by native engine.", e))
        } catch (e: Exception) {
            Result.failure(IOException("Failed to initialize PDF renderer: ${e.message}", e))
        }
    }

    /**
     * Renders a single page into a recycled or newly allocated Bitmap.
     * Ensures previous bitmap is safely recycled.
     */
    suspend fun renderPage(pageIndex: Int, targetWidth: Int, targetHeight: Int): Result<Bitmap> = withContext(Dispatchers.Default) {
        val renderer = pdfRenderer ?: return@withContext Result.failure(IllegalStateException("PdfRenderer not initialized"))
        if (pageIndex < 0 || pageIndex >= pageCount) {
            return@withContext Result.failure(IndexOutOfBoundsException("Page index $pageIndex out of bounds (0..$pageCount)"))
        }

        try {
            // Close any open page before opening a new one
            currentActivePage?.close()
            currentActivePage = null

            val page = renderer.openPage(pageIndex)
            currentActivePage = page

            // Calculate bounded dimensions
            val originalWidth = page.width
            val originalHeight = page.height

            val scale = minOf(
                targetWidth.toFloat() / originalWidth.toFloat(),
                targetHeight.toFloat() / originalHeight.toFloat(),
                2.5f // Max zoom scale factor to cap bitmap size
            ).coerceAtLeast(0.5f)

            val renderWidth = (originalWidth * scale).toInt().coerceIn(100, 2048)
            val renderHeight = (originalHeight * scale).toInt().coerceIn(100, 2048)

            // Memory recycling: Recycle previous bitmap
            lastRenderedBitmap?.let { oldBmp ->
                if (!oldBmp.isRecycled) {
                    oldBmp.recycle()
                }
            }
            lastRenderedBitmap = null

            val bitmap = Bitmap.createBitmap(renderWidth, renderHeight, Bitmap.Config.ARGB_8888)
            bitmap.eraseColor(Color.WHITE) // default white background

            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            lastRenderedBitmap = bitmap

            Result.success(bitmap)
        } catch (oom: OutOfMemoryError) {
            System.gc()
            Result.failure(OutOfMemoryError("Device low on memory while rendering page $pageIndex."))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun close() {
        try {
            currentActivePage?.close()
            currentActivePage = null
            pdfRenderer?.close()
            pdfRenderer = null
            fileDescriptor?.close()
            fileDescriptor = null
            lastRenderedBitmap?.let {
                if (!it.isRecycled) it.recycle()
            }
            lastRenderedBitmap = null
        } catch (_: Exception) {
        }
    }
}
