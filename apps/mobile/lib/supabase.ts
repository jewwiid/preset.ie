import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import * as aesjs from 'aes-js'
import 'react-native-get-random-values'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Platform-specific storage adapter
class PlatformStorageAdapter {
  private async _encrypt(key: string, value: string) {
    const encryptionKey = key.substring(0, 32).padEnd(32, '0')
    const textBytes = aesjs.utils.utf8.toBytes(value)
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.utf8.toBytes(encryptionKey),
      new aesjs.Counter(5)
    )
    const encryptedBytes = aesCtr.encrypt(textBytes)
    const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes)
    return encryptedHex
  }

  private async _decrypt(key: string, value: string) {
    const encryptionKey = key.substring(0, 32).padEnd(32, '0')
    const encryptedBytes = aesjs.utils.hex.toBytes(value)
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.utf8.toBytes(encryptionKey),
      new aesjs.Counter(5)
    )
    const decryptedBytes = aesCtr.decrypt(encryptedBytes)
    const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes)
    return decryptedText
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        return localStorage.getItem(key)
      } else {
        // Use SecureStore for native platforms
        const encrypted = await SecureStore.getItemAsync(key)
        if (!encrypted) return null
        return await this._decrypt(key, encrypted)
      }
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.setItem(key, value)
      } else {
        // Use SecureStore for native platforms
        const encrypted = await this._encrypt(key, value)
        await SecureStore.setItemAsync(key, encrypted)
      }
    } catch (error) {
      console.error('Storage set error:', error)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.removeItem(key)
      } else {
        // Use SecureStore for native platforms
        await SecureStore.deleteItemAsync(key)
      }
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new PlatformStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Helper function to upload media
export const uploadMedia = async (
  uri: string,
  bucket: string,
  path: string
): Promise<{ data: any; error: any }> => {
  try {
    const response = await fetch(uri)
    const blob = await response.blob()
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType: blob.type,
        upsert: false,
      })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Helper to get public URL for media
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}