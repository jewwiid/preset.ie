// Optimal NanoBanana Top-up Strategy Based on User Growth
// This script calculates the optimal top-up amounts based on registered users

const topUpStrategy = {
  // Calculate optimal top-up based on current user count
  calculateOptimalTopUp: (registeredUsers, avgCreditsPerUserPerMonth = 15) => {
    const userSegments = {
      free: Math.floor(registeredUsers * 0.7), // 70% free users
      plus: Math.floor(registeredUsers * 0.2), // 20% plus users  
      pro: Math.floor(registeredUsers * 0.1)    // 10% pro users
    };

    // Calculate expected monthly credit consumption
    const freeUsage = userSegments.free * 5; // Free users buy ~5 credits/month
    const plusUsage = userSegments.plus * 10; // Plus users get 10 free + buy ~10 more
    const proUsage = userSegments.pro * 25;  // Pro users get 25 free + buy ~15 more
    
    const totalExpectedUsage = freeUsage + plusUsage + proUsage;
    
    // Add 30% buffer for growth and spikes
    const recommendedCredits = Math.ceil(totalExpectedUsage * 1.3);
    
    return {
      registeredUsers,
      userSegments,
      expectedMonthlyUsage: totalExpectedUsage,
      recommendedCredits,
      recommendedInvestment: Math.ceil(recommendedCredits * 0.025), // $0.025 per NanoBanana credit
      costPerUserCredit: (Math.ceil(recommendedCredits * 0.025) / (recommendedCredits / 4)).toFixed(4)
    };
  },

  // Get top-up recommendations for different user counts
  getRecommendations: () => {
    const scenarios = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
    
    return scenarios.map(users => {
      const result = topUpStrategy.calculateOptimalTopUp(users);
      return {
        users,
        investment: `$${result.recommendedInvestment}`,
        credits: `${result.recommendedCredits.toLocaleString()} NanoBanana credits`,
        userCapacity: `${Math.floor(result.recommendedCredits / 4).toLocaleString()} user credits`,
        costPerCredit: `$${result.costPerUserCredit}`,
        expectedUsage: `${result.expectedMonthlyUsage} credits/month`
      };
    });
  }
};

// Example usage and recommendations
console.log('🎯 OPTIMAL TOP-UP STRATEGY BASED ON USER GROWTH\n');

const recommendations = topUpStrategy.getRecommendations();

console.log('📊 SCALING RECOMMENDATIONS:\n');
console.log('Users | Investment | NanoBanana Credits | User Capacity | Cost/Credit | Expected Usage');
console.log('------|-------------|-------------------|---------------|-------------|---------------');

recommendations.forEach(rec => {
  console.log(
    `${rec.users.toString().padStart(5)} | ${rec.investment.padStart(10)} | ${rec.credits.padStart(18)} | ${rec.userCapacity.padStart(13)} | ${rec.costPerCredit.padStart(11)} | ${rec.expectedUsage.padStart(15)}`
  );
});

console.log('\n🎯 KEY INSIGHTS:');
console.log('• Start with $50-$100 investments for <100 users');
console.log('• Scale to $250-$500 for 100-500 users');  
console.log('• Use $1000+ investments for 500+ users');
console.log('• Always maintain 30% buffer for growth');
console.log('• Monitor usage patterns and adjust monthly');

// Specific recommendation for current scenario
console.log('\n💡 FOR YOUR CURRENT SITUATION:');
console.log('If you have 100 registered users:');
const currentRec = topUpStrategy.calculateOptimalTopUp(100);
console.log(`• Recommended investment: $${currentRec.recommendedInvestment}`);
console.log(`• NanoBanana credits: ${currentRec.recommendedCredits.toLocaleString()}`);
console.log(`• User credit capacity: ${Math.floor(currentRec.recommendedCredits / 4).toLocaleString()}`);
console.log(`• Expected monthly usage: ${currentRec.expectedMonthlyUsage} credits`);
console.log(`• Cost per user credit: $${currentRec.costPerUserCredit}`);

module.exports = topUpStrategy;
