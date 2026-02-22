
require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' // Matches our backend version
});

const setupStripe = async () => {
    console.log('Setting up Stripe products...');

    // 1. Create or Find "Pro Plan" Product
    let product;
    const products = await stripe.products.list({ limit: 10 });
    product = products.data.find(p => p.name === 'Nalyse Professional');

    if (!product) {
        console.log('Creating "Nalyse Professional" product...');
        product = await stripe.products.create({
            name: 'Nalyse Professional',
            description: 'Advanced analytics for power users',
        });
    } else {
        console.log('Found existing "Nalyse Professional" product:', product.id);
    }

    // 2. Create Price for Pro Plan ($29/month)
    let price;
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
    price = prices.data.find(p => p.unit_amount === 2900 && p.recurring?.interval === 'month');

    if (!price) {
        console.log('Creating Price ($29/month)...');
        price = await stripe.prices.create({
            unit_amount: 2900,
            currency: 'usd',
            recurring: { interval: 'month' },
            product: product.id,
        });
    } else {
        console.log('Found existing Price:', price.id);
    }

    // 3. Output the Price ID for the .env file
    console.log('\n--- SETUP SUCCESSFUL ---');
    console.log('Add this Price ID to your .env file as STRIPE_PRICE_ID_PRO:');
    console.log(`STRIPE_PRICE_ID_PRO=${price.id}`);
    console.log('------------------------\n');
};

setupStripe().catch(console.error);
