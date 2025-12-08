// services/backupManager.ts
import { useMediaCacheStore } from '@/stores/mediaCacheStore';
import { useUserDataStore } from '@/stores/userDataStore';
import { BackupData } from '@/types/storage';

export class BackupManager {
  static exportBackup(): string {
    const mediaCache = useMediaCacheStore.getState();
    const userData = useUserDataStore.getState();
    
    const backupData: BackupData = {
      mediaCache: mediaCache.cache,
      userData: userData.exportData(),
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(backupData, null, 2);
  }
  
  static async importBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);
      
      // Валидация данных
      if (!backupData.mediaCache || !backupData.userData) {
        throw new Error('Invalid backup file format');
      }
      
      // Импорт кэша медиа
      const mediaCacheStore = useMediaCacheStore.getState();
      mediaCacheStore.clearCache();
      mediaCacheStore.addMultipleToCache(Object.values(backupData.mediaCache));
      
      // Импорт пользовательских данных
      const userDataStore = useUserDataStore.getState();
      userDataStore.importData(backupData.userData);
      
      return true;
    } catch (error) {
      console.error('Failed to import backup:', error);
      return false;
    }
  }
  
  static downloadBackup() {
    const backup = this.exportBackup();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `movie-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}