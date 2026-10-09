package com.docuflex.core.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [DocumentEntity::class], version = 1, exportSchema = false)
abstract class DocuFlexDatabase : RoomDatabase() {
    abstract fun documentDao(): DocumentDao

    companion object {
        @Volatile
        private var INSTANCE: DocuFlexDatabase? = null

        fun getInstance(context: Context): DocuFlexDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    DocuFlexDatabase::class.java,
                    "docuflex_metadata.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
