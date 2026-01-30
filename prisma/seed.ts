import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
    await prisma.country.deleteMany();

    console.log('✨ Cleared existing data');

    // Create countries
    const india = await prisma.country.create({
        data: { name: 'India', code: 'IN' },
    });

    const america = await prisma.country.create({
        data: { name: 'America', code: 'US' },
    });

    console.log('🌍 Created countries');

    // Create users as per requirements
    const nickFury = await prisma.user.create({
        data: {
            name: 'Nick Fury',
            email: 'nick.fury@shield.com',
            role: Role.ADMIN,
            countryId: america.id, // Admin based in America but has access to all
        },
    });

    const captainMarvel = await prisma.user.create({
        data: {
            name: 'Captain Marvel',
            email: 'captain.marvel@shield.com',
            role: Role.MANAGER,
            countryId: india.id,
        },
    });

    const captainAmerica = await prisma.user.create({
        data: {
            name: 'Captain America',
            email: 'captain.america@shield.com',
            role: Role.MANAGER,
            countryId: america.id,
        },
    });

    const thanos = await prisma.user.create({
        data: {
            name: 'Thanos',
            email: 'thanos@shield.com',
            role: Role.MEMBER,
            countryId: india.id,
        },
    });

    const thor = await prisma.user.create({
        data: {
            name: 'Thor',
            email: 'thor@shield.com',
            role: Role.MEMBER,
            countryId: india.id,
        },
    });

    const travis = await prisma.user.create({
        data: {
            name: 'Travis',
            email: 'travis@shield.com',
            role: Role.MEMBER,
            countryId: america.id,
        },
    });

    console.log('👥 Created users');

    // Create payment methods for users
    await prisma.paymentMethod.create({
        data: {
            userId: nickFury.id,
            type: 'CREDIT_CARD',
            lastFour: '4242',
            isDefault: true,
        },
    });

    await prisma.paymentMethod.create({
        data: {
            userId: captainMarvel.id,
            type: 'UPI',
            lastFour: '9876',
            isDefault: true,
        },
    });

    await prisma.paymentMethod.create({
        data: {
            userId: captainAmerica.id,
            type: 'DEBIT_CARD',
            lastFour: '1234',
            isDefault: true,
        },
    });

    console.log('💳 Created payment methods');

    // Create Indian restaurants
    const spiceGarden = await prisma.restaurant.create({
        data: {
            name: 'Spice Garden',
            description: 'Authentic North Indian cuisine with a modern twist. Famous for our butter chicken and naan.',
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
            cuisine: 'North Indian',
            rating: 4.5,
            countryId: india.id,
        },
    });

    const dosaPlaza = await prisma.restaurant.create({
        data: {
            name: 'Dosa Plaza',
            description: 'South Indian delicacies - crispy dosas, fluffy idlis, and aromatic sambhar.',
            image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800',
            cuisine: 'South Indian',
            rating: 4.3,
            countryId: india.id,
        },
    });

    const biryaniHouse = await prisma.restaurant.create({
        data: {
            name: 'Biryani House',
            description: 'Royal Hyderabadi biryani cooked in traditional dum style with finest spices.',
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
            cuisine: 'Hyderabadi',
            rating: 4.7,
            countryId: india.id,
        },
    });

    // Create American restaurants
    const burgerBarn = await prisma.restaurant.create({
        data: {
            name: 'Burger Barn',
            description: 'Classic American burgers made with 100% Angus beef and fresh ingredients.',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
            cuisine: 'American',
            rating: 4.4,
            countryId: america.id,
        },
    });

    const pizzaPalace = await prisma.restaurant.create({
        data: {
            name: 'Pizza Palace',
            description: 'New York style pizzas with hand-tossed dough and premium toppings.',
            image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
            cuisine: 'Italian-American',
            rating: 4.6,
            countryId: america.id,
        },
    });

    const steakStation = await prisma.restaurant.create({
        data: {
            name: 'Steak Station',
            description: 'Premium steakhouse featuring USDA Prime cuts and classic American sides.',
            image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',
            cuisine: 'Steakhouse',
            rating: 4.8,
            countryId: america.id,
        },
    });

    console.log('🍽️ Created restaurants');

    // Add menu items to Spice Garden (India)
    await prisma.menuItem.createMany({
        data: [
            {
                name: 'Butter Chicken',
                description: 'Tender chicken in creamy tomato-based curry',
                price: 350,
                image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
                category: 'Main Course',
                isVegetarian: false,
                restaurantId: spiceGarden.id,
            },
            {
                name: 'Paneer Tikka Masala',
                description: 'Grilled cottage cheese in spiced gravy',
                price: 280,
                image: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=400',
                category: 'Main Course',
                isVegetarian: true,
                restaurantId: spiceGarden.id,
            },
            {
                name: 'Garlic Naan',
                description: 'Fresh baked bread with garlic butter',
                price: 60,
                image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
                category: 'Breads',
                isVegetarian: true,
                restaurantId: spiceGarden.id,
            },
            {
                name: 'Dal Makhani',
                description: 'Slow-cooked black lentils in creamy sauce',
                price: 220,
                image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
                category: 'Main Course',
                isVegetarian: true,
                restaurantId: spiceGarden.id,
            },
        ],
    });

    // Add menu items to Dosa Plaza (India)
    await prisma.menuItem.createMany({
        data: [
            {
                name: 'Masala Dosa',
                description: 'Crispy crepe with spiced potato filling',
                price: 120,
                image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400',
                category: 'Dosas',
                isVegetarian: true,
                restaurantId: dosaPlaza.id,
            },
            {
                name: 'Idli Sambhar',
                description: 'Steamed rice cakes with lentil soup',
                price: 80,
                image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
                category: 'Breakfast',
                isVegetarian: true,
                restaurantId: dosaPlaza.id,
            },
            {
                name: 'Mysore Bonda',
                description: 'Crispy lentil fritters',
                price: 60,
                image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=400',
                category: 'Snacks',
                isVegetarian: true,
                restaurantId: dosaPlaza.id,
            },
            {
                name: 'Filter Coffee',
                description: 'Traditional South Indian coffee',
                price: 40,
                image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
                category: 'Beverages',
                isVegetarian: true,
                restaurantId: dosaPlaza.id,
            },
        ],
    });

    // Add menu items to Biryani House (India)
    await prisma.menuItem.createMany({
        data: [
            {
                name: 'Chicken Dum Biryani',
                description: 'Aromatic rice with tender chicken and spices',
                price: 320,
                image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
                category: 'Biryani',
                isVegetarian: false,
                restaurantId: biryaniHouse.id,
            },
            {
                name: 'Mutton Biryani',
                description: 'Slow-cooked lamb with basmati rice',
                price: 380,
                image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400',
                category: 'Biryani',
                isVegetarian: false,
                restaurantId: biryaniHouse.id,
            },
            {
                name: 'Veg Biryani',
                description: 'Mixed vegetables with fragrant rice',
                price: 240,
                image: 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=400',
                category: 'Biryani',
                isVegetarian: true,
                restaurantId: biryaniHouse.id,
            },
            {
                name: 'Mirchi Ka Salan',
                description: 'Spicy green chili curry',
                price: 120,
                image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
                category: 'Sides',
                isVegetarian: true,
                restaurantId: biryaniHouse.id,
            },
        ],
    });

    // Add menu items to Burger Barn (America)
    await prisma.menuItem.createMany({
        data: [
            {
                name: 'Classic Cheeseburger',
                description: 'Angus beef patty with cheddar cheese',
                price: 12.99,
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
                category: 'Burgers',
                isVegetarian: false,
                restaurantId: burgerBarn.id,
            },
            {
                name: 'Bacon BBQ Burger',
                description: 'Beef patty with crispy bacon and BBQ sauce',
                price: 14.99,
                image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400',
                category: 'Burgers',
                isVegetarian: false,
                restaurantId: burgerBarn.id,
            },
            {
                name: 'Veggie Burger',
                description: 'Plant-based patty with fresh toppings',
                price: 11.99,
                image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400',
                category: 'Burgers',
                isVegetarian: true,
                restaurantId: burgerBarn.id,
            },
            {
                name: 'Loaded Fries',
                description: 'Crispy fries with cheese and bacon bits',
                price: 6.99,
                image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
                category: 'Sides',
                isVegetarian: false,
                restaurantId: burgerBarn.id,
            },
        ],
    });

    // Add menu items to Pizza Palace (America)
    await prisma.menuItem.createMany({
        data: [
            {
                name: 'Pepperoni Supreme',
                description: 'Classic pepperoni with mozzarella',
                price: 18.99,
                image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
                category: 'Pizza',
                isVegetarian: false,
                restaurantId: pizzaPalace.id,
            },
            {
                name: 'Margherita',
                description: 'Fresh tomatoes, basil, and mozzarella',
                price: 15.99,
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
                category: 'Pizza',
                isVegetarian: true,
                restaurantId: pizzaPalace.id,
            },
            {
                name: 'BBQ Chicken Pizza',
                description: 'Grilled chicken with tangy BBQ sauce',
                price: 19.99,
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
                category: 'Pizza',
                isVegetarian: false,
                restaurantId: pizzaPalace.id,
            },
            {
                name: 'Garlic Knots',
                description: 'Buttery garlic bread knots',
                price: 5.99,
                image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400',
                category: 'Sides',
                isVegetarian: true,
                restaurantId: pizzaPalace.id,
            },
        ],
    });

    // Add menu items to Steak Station (America)
    await prisma.menuItem.createMany({
        data: [
            {
                name: 'Ribeye Steak',
                description: '16oz USDA Prime ribeye, grilled to perfection',
                price: 45.99,
                image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
                category: 'Steaks',
                isVegetarian: false,
                restaurantId: steakStation.id,
            },
            {
                name: 'Filet Mignon',
                description: '8oz tender filet with herb butter',
                price: 52.99,
                image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400',
                category: 'Steaks',
                isVegetarian: false,
                restaurantId: steakStation.id,
            },
            {
                name: 'Caesar Salad',
                description: 'Romaine lettuce with classic Caesar dressing',
                price: 12.99,
                image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400',
                category: 'Salads',
                isVegetarian: true,
                restaurantId: steakStation.id,
            },
            {
                name: 'Loaded Baked Potato',
                description: 'Baked potato with sour cream and chives',
                price: 8.99,
                image: 'https://images.unsplash.com/photo-1568569350062-ebfa3cb195df?w=400',
                category: 'Sides',
                isVegetarian: true,
                restaurantId: steakStation.id,
            },
        ],
    });

    console.log('🍕 Created menu items');

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Users created:');
    console.log('  - Nick Fury (Admin)');
    console.log('  - Captain Marvel (Manager - India)');
    console.log('  - Captain America (Manager - America)');
    console.log('  - Thanos (Member - India)');
    console.log('  - Thor (Member - India)');
    console.log('  - Travis (Member - America)');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
