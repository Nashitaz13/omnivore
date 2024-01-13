import { env } from './env'

import { Queue, RedisOptions } from 'bullmq'
import Redis from 'ioredis'

const createRSSRefreshFeedQueue = (): Queue | undefined => {
  if (!env.redis.url) {
    return undefined
  }
  const redisOptions = (): RedisOptions => {
    if (env.redis.url?.startsWith('rediss://') && env.redis.cert) {
      return {
        tls: {
          ca: env.redis.cert,
          rejectUnauthorized: false,
        },
        maxRetriesPerRequest: null,
      }
    }
    return {
      maxRetriesPerRequest: null,
    }
  }

  const connection = new Redis(env.redis.url ?? '', redisOptions())
  return new Queue('rssRefreshFeed', { connection })
}

const rssRefreshFeedJobQueue = createRSSRefreshFeedQueue()

export const addRefreshFeedJob = async (jobid: string, payload: any) => {
  if (!rssRefreshFeedJobQueue) {
    return false
  }
  return rssRefreshFeedJobQueue?.add('rssRefreshFeed', payload, {
    jobId: jobid,
    removeOnComplete: true,
    removeOnFail: true,
  })
}
