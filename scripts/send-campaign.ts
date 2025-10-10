#!/usr/bin/env ts-node
/**
 * CLI Tool for Sending Plunk Campaigns
 * Usage: ts-node scripts/send-campaign.ts
 */

import * as readline from 'readline';
import {
  createTalentCampaign,
  createSpecializationCampaign,
  PlunkCampaignsService
} from '../apps/web/lib/services/plunk-campaigns.service';
import {
  getActorsCampaignTemplate,
  getVideographersCampaignTemplate,
  getSegmentedCampaignTemplate
} from '../apps/web/lib/services/emails/templates/campaigns.templates';
import { TALENT_CATEGORIES, SPECIALIZATIONS } from '../apps/web/lib/constants/creative-options';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🎯 Plunk Campaign Creator\n');
  console.log('=' .repeat(50));
  
  // Step 1: Choose campaign type
  console.log('\n📋 Choose campaign type:');
  console.log('1. Target specific talent (actors, models, etc.)');
  console.log('2. Target specific specializations (photographers, videographers)');
  console.log('3. Custom targeting');
  
  const campaignType = await question('\nEnter choice (1-3): ');
  
  if (campaignType === '1') {
    await createTalentTypeCampaign();
  } else if (campaignType === '2') {
    await createSpecializationTypeCampaign();
  } else if (campaignType === '3') {
    await createCustomCampaign();
  } else {
    console.log('❌ Invalid choice');
    rl.close();
    return;
  }
  
  rl.close();
}

async function createTalentTypeCampaign() {
  console.log('\n📋 Available talent categories:');
  console.log('Common: Actor, Model, Dancer, Musician, Voice Actor, Influencer');
  console.log(`Full list: ${TALENT_CATEGORIES.slice(0, 10).join(', ')}...`);
  
  const talentInput = await question('\nEnter talent categories (comma-separated): ');
  const talents = talentInput.split(',').map(t => t.trim());
  
  const subject = await question('Email subject: ');
  const heading = await question('Email heading: ');
  const message = await question('Email message: ');
  const ctaText = await question('CTA button text: ');
  const ctaUrl = await question('CTA URL: ');
  
  const testEmail = await question('\nTest email (leave blank to skip): ');
  const sendNow = await question('Send now? (y/n): ');
  
  console.log('\n🚀 Creating campaign...\n');
  
  try {
    const result = await createTalentCampaign(
      talents,
      {
        subject,
        body: getActorsCampaignTemplate('Talent', {
          heading,
          message,
          ctaText,
          ctaUrl
        })
      },
      {
        testEmails: testEmail ? [testEmail] : undefined,
        sendNow: sendNow.toLowerCase() === 'y'
      }
    );
    
    console.log('✅ Campaign created successfully!');
    console.log(`📧 Campaign ID: ${result.id}`);
    console.log(`👥 Recipients: ${result.recipientCount}`);
    
    if (testEmail) {
      console.log(`🧪 Test sent to: ${testEmail}`);
    }
    
    if (sendNow.toLowerCase() === 'y') {
      console.log('📤 Campaign sent!');
    } else {
      console.log('💡 Campaign saved as draft. Review and send from Plunk dashboard.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

async function createSpecializationTypeCampaign() {
  console.log('\n📋 Available specializations:');
  console.log('Photography: Fashion Photography, Portrait Photography, Commercial Photography');
  console.log('Video: Cinematography, Video Production, Music Video Production');
  console.log(`Full list: ${SPECIALIZATIONS.slice(0, 10).join(', ')}...`);
  
  const specInput = await question('\nEnter specializations (comma-separated): ');
  const specializations = specInput.split(',').map(s => s.trim());
  
  const subject = await question('Email subject: ');
  const heading = await question('Email heading: ');
  const message = await question('Email message: ');
  const ctaText = await question('CTA button text: ');
  const ctaUrl = await question('CTA URL: ');
  
  const testEmail = await question('\nTest email (leave blank to skip): ');
  const sendNow = await question('Send now? (y/n): ');
  
  console.log('\n🚀 Creating campaign...\n');
  
  try {
    const result = await createSpecializationCampaign(
      specializations,
      {
        subject,
        body: getSegmentedCampaignTemplate('Professional', specializations.join(' & '), {
          heading,
          message,
          ctaText,
          ctaUrl
        })
      },
      {
        testEmails: testEmail ? [testEmail] : undefined,
        sendNow: sendNow.toLowerCase() === 'y'
      }
    );
    
    console.log('✅ Campaign created successfully!');
    console.log(`📧 Campaign ID: ${result.id}`);
    console.log(`👥 Recipients: ${result.recipientCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

async function createCustomCampaign() {
  console.log('\n🔧 Custom Campaign Builder');
  console.log('Configure your targeting criteria:\n');
  
  const rolesInput = await question('Roles (TALENT, CONTRIBUTOR, BOTH) - comma-separated: ');
  const citiesInput = await question('Cities (optional) - comma-separated: ');
  const tiersInput = await question('Subscription tiers (FREE, PLUS, PRO) - comma-separated: ');
  const verifiedInput = await question('Verified only? (y/n): ');
  const activeInput = await question('Active users only? (y/n): ');
  
  const subject = await question('\nEmail subject: ');
  const heading = await question('Email heading: ');
  const message = await question('Email message: ');
  const ctaText = await question('CTA button text: ');
  const ctaUrl = await question('CTA URL: ');
  
  const testEmail = await question('\nTest email (leave blank to skip): ');
  const sendNow = await question('Send now? (y/n): ');
  
  console.log('\n🚀 Creating custom campaign...\n');
  
  try {
    const service = new PlunkCampaignsService();
    
    const targeting: any = {};
    
    if (rolesInput.trim()) {
      targeting.roles = rolesInput.split(',').map(r => r.trim());
    }
    
    if (citiesInput.trim()) {
      targeting.cities = citiesInput.split(',').map(c => c.trim());
    }
    
    if (tiersInput.trim()) {
      targeting.tiers = tiersInput.split(',').map(t => t.trim());
    }
    
    if (verifiedInput.toLowerCase() === 'y') {
      targeting.verified = true;
    }
    
    if (activeInput.toLowerCase() === 'y') {
      targeting.active = true;
    }
    
    const result = await service.createCampaign({
      name: `Custom Campaign - ${new Date().toISOString()}`,
      targeting,
      content: {
        subject,
        body: getSegmentedCampaignTemplate('User', 'Custom Segment', {
          heading,
          message,
          ctaText,
          ctaUrl
        })
      },
      testEmails: testEmail ? [testEmail] : undefined,
      sendNow: sendNow.toLowerCase() === 'y'
    });
    
    console.log('✅ Campaign created successfully!');
    console.log(`📧 Campaign ID: ${result.id}`);
    console.log(`👥 Recipients: ${result.recipientCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

