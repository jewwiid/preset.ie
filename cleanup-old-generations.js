#!/usr/bin/env node

/**
 * Cleanup Script for Old Playground Generations
 * 
 * This script automatically deletes playground projects older than 6 days
 * that haven't been saved to the user's gallery.
 * 
 * Usage:
 *   node cleanup-old-generations.js
 * 
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - CLEANUP_TOKEN (optional, defaults to 'default-cleanup-token')
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const cleanupToken = process.env.CLEANUP_TOKEN || 'default-cleanup-token'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupOldGenerations() {
  console.log('🧹 Starting cleanup of old playground generations...')
  console.log('📅 Looking for projects older than 6 days...\n')

  try {
    // Calculate date 6 days ago
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
    
    console.log(`🗓️  Cutoff date: ${sixDaysAgo.toISOString()}`)

    // Get all projects older than 6 days
    const { data: oldProjects, error: fetchError } = await supabaseAdmin
      .from('playground_projects')
      .select(`
        id,
        user_id,
        title,
        status,
        created_at,
        credits_used
      `)
      .lt('created_at', sixDaysAgo.toISOString())
      .neq('status', 'saved') // Don't delete saved projects

    if (fetchError) {
      throw new Error(`Failed to fetch old projects: ${fetchError.message}`)
    }

    if (!oldProjects || oldProjects.length === 0) {
      console.log('✅ No old projects found to clean up!')
      return
    }

    console.log(`📊 Found ${oldProjects.length} old projects`)

    // Get all saved projects to avoid deleting them
    const { data: savedProjects, error: savedError } = await supabaseAdmin
      .from('playground_gallery')
      .select('project_id')
      .not('project_id', 'is', null)

    if (savedError) {
      throw new Error(`Failed to fetch saved projects: ${savedError.message}`)
    }

    const savedProjectIds = new Set(savedProjects?.map(p => p.project_id) || [])
    
    // Filter out projects that have been saved to gallery
    const projectsToDelete = oldProjects.filter(project => 
      !savedProjectIds.has(project.id)
    )

    if (projectsToDelete.length === 0) {
      console.log('✅ No unsaved old projects found to clean up!')
      return
    }

    console.log(`🗑️  ${projectsToDelete.length} projects will be deleted (${oldProjects.length - projectsToDelete.length} saved projects preserved)`)
    
    // Show summary of projects to be deleted
    console.log('\n📋 Projects to be deleted:')
    projectsToDelete.forEach((project, index) => {
      const daysOld = Math.floor((new Date() - new Date(project.created_at)) / (1000 * 60 * 60 * 24))
      console.log(`   ${index + 1}. "${project.title}" (${daysOld} days old, ${project.credits_used} credits)`)
    })

    const projectIds = projectsToDelete.map(p => p.id)

    // Delete related image edits first (due to foreign key constraints)
    console.log('\n🔄 Deleting related image edits...')
    const { error: editsError } = await supabaseAdmin
      .from('playground_image_edits')
      .delete()
      .in('project_id', projectIds)

    if (editsError) {
      throw new Error(`Failed to delete image edits: ${editsError.message}`)
    }

    // Delete the old projects
    console.log('🔄 Deleting old projects...')
    const { error: deleteError } = await supabaseAdmin
      .from('playground_projects')
      .delete()
      .in('id', projectIds)

    if (deleteError) {
      throw new Error(`Failed to delete projects: ${deleteError.message}`)
    }

    // Calculate total credits that were "freed up"
    const totalCreditsFreed = projectsToDelete.reduce((sum, project) => sum + (project.credits_used || 0), 0)

    console.log('\n✅ Cleanup completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Projects deleted: ${projectsToDelete.length}`)
    console.log(`   - Projects preserved (saved to gallery): ${oldProjects.length - projectsToDelete.length}`)
    console.log(`   - Total credits that were used: ${totalCreditsFreed}`)
    console.log(`   - Cutoff date: ${sixDaysAgo.toISOString()}`)

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message)
    process.exit(1)
  }
}

// Run the cleanup
cleanupOldGenerations()
  .then(() => {
    console.log('\n🎉 Cleanup script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  })