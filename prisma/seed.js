/**
 * Database Seed Script
 * Seeds all models with sample data for development/testing
 * Run: npm run seed
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Create prisma client for seeding (without logger to avoid pino issues)
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Helper function to hash passwords
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

// Random helpers
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min, max) =>
  (Math.random() * (max - min) + min).toFixed(2);
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Sample data
const tshirtImages = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1622445275576-721325763afe?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=800&fit=crop",
];

const productNames = [
  "Classic White Tee",
  "Midnight Black Essential",
  "Urban Grey Comfort",
  "Olive Green Organic",
  "Navy Blue Premium",
  "Stone Wash Vintage",
  "Burgundy Classic",
  "Cream Organic Cotton",
  "Charcoal Heather",
  "Forest Green Essential",
  "Ocean Blue Relaxed",
  "Sunset Orange Limited",
  "Lavender Dream",
  "Rust Red Vintage",
  "Sky Blue Light",
];

const descriptions = [
  "Premium quality t-shirt crafted from 100% organic cotton. Features a relaxed fit and soft-washed finish for ultimate comfort.",
  "Our signature essential tee with a modern fit. Made from sustainable materials with eco-friendly dyes.",
  "A versatile everyday piece that pairs with anything. Soft, breathable, and built to last.",
  "GOTS certified organic cotton for the eco-conscious. Comfort meets sustainability.",
  "Premium heavyweight cotton with a refined finish. Perfect for any occasion.",
];

const cities = ["Cairo", "Alexandria", "Riyadh", "Jeddah", "Dubai"];
const states = ["Cairo", "Giza", "Eastern Province", "Western Region", "Dubai"];
const countries = ["Egypt", "Saudi Arabia", "UAE"];

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.notificationJob.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.productModifier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // 1. Create Users
  // ============================================
  console.log("👤 Creating users...");

  // Admin user
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.create({
    data: {
      email: "admin@threads.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      phone: "+201234567890",
      admin: { create: {} },
    },
  });
  console.log(`   ✓ Admin: ${admin.email}`);

  // Customer users
  const customers = [];
  const customerData = [
    { email: "john@example.com", firstName: "John", lastName: "Doe" },
    { email: "sarah@example.com", firstName: "Sarah", lastName: "Johnson" },
    { email: "ahmed@example.com", firstName: "Ahmed", lastName: "Al-Rashid" },
    { email: "emily@example.com", firstName: "Emily", lastName: "Chen" },
    {
      email: "mohammed@example.com",
      firstName: "Mohammed",
      lastName: "Hassan",
    },
  ];

  const customerPassword = await hashPassword("customer123");
  for (const data of customerData) {
    const customer = await prisma.user.create({
      data: {
        email: data.email,
        password: customerPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "CUSTOMER",
        phone: `+20${randomInt(1000000000, 9999999999)}`,
        customer: { create: {} },
      },
    });
    customers.push(customer);
    console.log(`   ✓ Customer: ${customer.email}`);
  }

  // ============================================
  // 2. Create Addresses
  // ============================================
  console.log("\n📍 Creating addresses...");

  for (const customer of customers) {
    const addressCount = randomInt(1, 3);
    for (let i = 0; i < addressCount; i++) {
      await prisma.address.create({
        data: {
          userId: customer.id,
          street: `${randomInt(1, 500)} ${randomElement([
            "Main",
            "Oak",
            "Elm",
            "Park",
            "Cedar",
          ])} Street, Apt ${randomInt(1, 50)}`,
          city: randomElement(cities),
          state: randomElement(states),
          zip: `${randomInt(10000, 99999)}`,
          country: randomElement(countries),
          isDefault: i === 0,
          label: i === 0 ? "Home" : randomElement(["Work", "Office", "Other"]),
        },
      });
    }
  }
  console.log(`   ✓ Created addresses for ${customers.length} customers`);

  // ============================================
  // 3. Create Offers
  // ============================================
  console.log("\n🏷️  Creating offers...");

  const globalOffer = await prisma.offer.create({
    data: {
      name: "Winter Sale",
      description: "10% off everything!",
      type: "PERCENTAGE",
      value: 10,
      scope: "GLOBAL",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
    },
  });
  console.log(`   ✓ Global offer: ${globalOffer.name}`);

  const productOffer = await prisma.offer.create({
    data: {
      name: "Flash Sale - Premium Collection",
      description: "20% off selected items",
      type: "PERCENTAGE",
      value: 20,
      scope: "PRODUCT",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true,
    },
  });
  console.log(`   ✓ Product offer: ${productOffer.name}`);

  const fixedOffer = await prisma.offer.create({
    data: {
      name: "New Arrival Special",
      description: "$5 off new items",
      type: "FIXED",
      value: 5,
      scope: "PRODUCT",
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      isActive: true,
    },
  });
  console.log(`   ✓ Fixed offer: ${fixedOffer.name}`);

  // ============================================
  // 4. Create Products
  // ============================================
  console.log("\n👕 Creating products...");

  const products = [];
  for (let i = 0; i < productNames.length; i++) {
    const hasOffer = i < 3; // First 3 products have offers
    const product = await prisma.product.create({
      data: {
        name: productNames[i],
        description: randomElement(descriptions),
        price: randomDecimal(35, 75),
        images: [tshirtImages[i % tshirtImages.length]],
        isActive: true,
        offerId: hasOffer ? (i === 0 ? productOffer.id : fixedOffer.id) : null,
        modifiers: {
          create: [
            {
              name: "Size",
              isRequired: true,
              multiSelect: false,
              options: {
                create: [
                  { name: "XS", price: 0 },
                  { name: "S", price: 0 },
                  { name: "M", price: 0 },
                  { name: "L", price: 0 },
                  { name: "XL", price: 2 },
                  { name: "XXL", price: 4 },
                ],
              },
            },
            {
              name: "Color",
              isRequired: false,
              multiSelect: false,
              options: {
                create: [
                  { name: "Standard", price: 0 },
                  { name: "Heather", price: 3 },
                  { name: "Vintage Wash", price: 5 },
                ],
              },
            },
          ],
        },
      },
    });
    products.push(product);
    console.log(`   ✓ ${product.name} - $${product.price}`);
  }

  // ============================================
  // 5. Create Coupons
  // ============================================
  console.log("\n🎫 Creating coupons...");

  const coupons = await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minPurchase: 50,
        limit: 100,
        expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "THREADS15",
        type: "PERCENTAGE",
        value: 15,
        minPurchase: 75,
        limit: 50,
        expireAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "SAVE20",
        type: "FIXED",
        value: 20,
        minPurchase: 100,
        limit: 200,
        expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "FREESHIP",
        type: "FIXED",
        value: 10,
        minPurchase: 0,
        limit: null,
        expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ],
  });
  console.log(`   ✓ Created ${coupons.count} coupons`);

  // ============================================
  // 6. Create Reviews
  // ============================================
  console.log("\n⭐ Creating reviews...");

  const reviewComments = [
    "Absolutely love this shirt! The quality is exceptional and it fits perfectly.",
    "Great value for money. Soft fabric and true to size.",
    "Perfect everyday tee. I've ordered three more!",
    "The organic cotton feels amazing. Worth every penny.",
    "Fast shipping and beautiful packaging. Will order again!",
    "Best t-shirt I've ever owned. Highly recommend!",
    "Nice quality but runs a bit small. Size up!",
    "Love the color and the fit. Very comfortable.",
  ];

  let reviewCount = 0;
  for (const product of products.slice(0, 10)) {
    const reviewerCount = randomInt(2, 4);
    const reviewers = customers.slice(0, reviewerCount);

    for (const reviewer of reviewers) {
      try {
        await prisma.review.create({
          data: {
            userId: reviewer.id,
            productId: product.id,
            rating: randomInt(4, 5),
            comment: randomElement(reviewComments),
          },
        });
        reviewCount++;
      } catch {
        // Skip if unique constraint violated (same user reviewing same product)
      }
    }
  }
  console.log(`   ✓ Created ${reviewCount} reviews`);

  // ============================================
  // 7. Create Orders
  // ============================================
  console.log("\n📦 Creating orders...");

  const orderStatuses = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERED"];
  let orderCount = 0;

  for (const customer of customers.slice(0, 3)) {
    const address = await prisma.address.findFirst({
      where: { userId: customer.id },
    });

    const orderProductCount = randomInt(1, 3);
    const orderProducts = products.slice(0, orderProductCount);

    let totalAmount = 0;
    const items = orderProducts.map((product) => {
      const quantity = randomInt(1, 3);
      const unitPrice = Number(product.price);
      const itemTotal = unitPrice * quantity;
      totalAmount += itemTotal;

      return {
        productId: product.id,
        quantity,
        unitPrice,
        totalPrice: itemTotal,
        selectedModifiers: { size: "M", color: "Standard" },
      };
    });

    await prisma.order.create({
      data: {
        customerId: customer.id,
        paymentMethod: randomElement(["COD", "ONLINE"]),
        paymentStatus: "PAID",
        status: randomElement(orderStatuses),
        totalAmount,
        discountAmount: 0,
        deliveryFee: totalAmount > 75 ? 0 : 10,
        shippingAddress: address
          ? {
              street: address.street,
              city: address.city,
              state: address.state,
              zip: address.zip,
              country: address.country,
            }
          : { street: "123 Main St", city: "Cairo", country: "Egypt" },
        items: { create: items },
      },
    });
    orderCount++;
  }
  console.log(`   ✓ Created ${orderCount} orders`);

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("✅ Database seeding completed!");
  console.log("=".repeat(50));
  console.log("\n📊 Summary:");
  console.log(
    `   • Users: ${customers.length + 1} (1 admin, ${
      customers.length
    } customers)`
  );
  console.log(`   • Products: ${products.length}`);
  console.log(`   • Offers: 3`);
  console.log(`   • Coupons: ${coupons.count}`);
  console.log(`   • Reviews: ${reviewCount}`);
  console.log(`   • Orders: ${orderCount}`);
  console.log("\n🔑 Login credentials:");
  console.log("   Admin:    admin@threads.com / admin123");
  console.log("   Customer: john@example.com / customer123");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
