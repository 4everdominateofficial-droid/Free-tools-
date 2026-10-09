package com.docuflex.core.viewer

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Robust image loader with automatic inSampleSize downsampling.
 * Defends against memory exhaustion from high-resolution images.
 */
class ImageEngine(private val context: Context) {

    data class ImageLoadResult(
        val bitmap: Bitmap,
        val originalWidth: Int,
        val originalHeight: Int,
        val sampleSize: Int
    )

    suspend fun loadImage(uri: Uri, maxTargetDimension: Int = 2048): Result<ImageLoadResult> = withContext(Dispatchers.IO) {
        try {
            // Step 1: Decode bounds only
            val boundsOptions = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }

            context.contentResolver.openInputStream(uri)?.use { stream ->
                BitmapFactory.decodeStream(stream, null, boundsOptions)
            } ?: return@withContext Result.failure(Exception("Cannot open image stream"))

            val origWidth = boundsOptions.outWidth
            val origHeight = boundsOptions.outHeight

            if (origWidth <= 0 || origHeight <= 0) {
                return@withContext Result.failure(IllegalArgumentException("Invalid image dimensions"))
            }

            // Step 2: Compute power-of-two inSampleSize
            var inSampleSize = 1
            var halfWidth = origWidth / 2
            var halfHeight = origHeight / 2

            while ((halfWidth / inSampleSize) >= maxTargetDimension ||
                (halfHeight / inSampleSize) >= maxTargetDimension
            ) {
                inSampleSize *= 2
            }

            // Step 3: Decode scaled bitmap
            val decodeOptions = BitmapFactory.Options().apply {
                this.inSampleSize = inSampleSize
                inPreferredConfig = Bitmap.Config.ARGB_8888
            }

            val bitmap = context.contentResolver.openInputStream(uri)?.use { stream ->
                BitmapFactory.decodeStream(stream, null, decodeOptions)
            } ?: return@withContext Result.failure(Exception("Failed to decode image bitmap"))

            Result.success(
                ImageLoadResult(
                    bitmap = bitmap,
                    originalWidth = origWidth,
                    originalHeight = origHeight,
                    sampleSize = inSampleSize
                )
            )
        } catch (oom: OutOfMemoryError) {
            System.gc()
            Result.failure(OutOfMemoryError("Out of memory while decoding high-resolution image."))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
