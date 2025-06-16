import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { LockHistoryEntity, LockAction } from '../entities/LockHistoryEntity';

class LockHistoryService {
  private lockHistoryRepository: Repository<LockHistoryEntity>;

  constructor() {
    this.lockHistoryRepository = AppDataSource.getRepository(LockHistoryEntity);
  }

  async recordLockAction(
    appointmentId: string,
    userId: string,
    userName: string,
    userEmail: string,
    action: LockAction,
    options: {
      duration?: number;
      releasedBy?: string;
      lockId?: string;
      metadata?: any;
    } = {}
  ): Promise<LockHistoryEntity> {
    const historyEntry = this.lockHistoryRepository.create({
      appointmentId,
      userId,
      userName,
      userEmail,
      action,
      duration: options.duration,
      releasedBy: options.releasedBy,
      lockId: options.lockId,
      metadata: options.metadata,
    });

    return await this.lockHistoryRepository.save(historyEntry);
  }

  async getLockHistory(
    appointmentId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    history: LockHistoryEntity[];
    total: number;
  }> {
    const [history, total] = await this.lockHistoryRepository.findAndCount({
      where: { appointmentId },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { history, total };
  }

  async getUserLockHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    history: LockHistoryEntity[];
    total: number;
  }> {
    const [history, total] = await this.lockHistoryRepository.findAndCount({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { history, total };
  }

  async getLockStatistics(appointmentId: string): Promise<{
    totalAcquisitions: number;
    totalReleases: number;
    totalExpired: number;
    totalForceReleases: number;
    averageDuration: number;
    uniqueUsers: number;
  }> {
    const history = await this.lockHistoryRepository.find({
      where: { appointmentId },
    });

    const acquisitions = history.filter(h => h.action === LockAction.ACQUIRED);
    const releases = history.filter(h => h.action === LockAction.RELEASED);
    const expired = history.filter(h => h.action === LockAction.EXPIRED);
    const forceReleases = history.filter(h => h.action === LockAction.FORCE_RELEASED);

    const durationsWithValues = history.filter(h => h.duration !== null && h.duration !== undefined);
    const averageDuration = durationsWithValues.length > 0
      ? durationsWithValues.reduce((sum, h) => sum + (h.duration || 0), 0) / durationsWithValues.length
      : 0;

    const uniqueUsers = new Set(history.map(h => h.userId)).size;

    return {
      totalAcquisitions: acquisitions.length,
      totalReleases: releases.length,
      totalExpired: expired.length,
      totalForceReleases: forceReleases.length,
      averageDuration: Math.round(averageDuration),
      uniqueUsers,
    };
  }

  async getRecentActivity(
    appointmentId?: string,
    limit: number = 20
  ): Promise<LockHistoryEntity[]> {
    const whereCondition = appointmentId ? { appointmentId } : {};
    
    return await this.lockHistoryRepository.find({
      where: whereCondition,
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async cleanupOldHistory(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.lockHistoryRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}

export default new LockHistoryService(); 