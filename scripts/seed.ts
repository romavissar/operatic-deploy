/**
 * Seed script: creates 2 example blog posts.
 * Run with: npm run seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const posts = [
  {
    title: "Introduction to Linear Programming",
    slug: "intro-linear-programming",
    published_at: new Date().toISOString(),
    excerpt: "A brief overview of LP: objective function, constraints, and the simplex method.",
    content: `## What is Linear Programming?

Linear programming (LP) is a method to achieve the best outcome (e.g. maximum profit or lowest cost) subject to linear constraints.

### The standard form

We maximize \\( c^T x \\) subject to \\( Ax \\leq b \\) and \\( x \\geq 0 \\).

- **Objective**: \\( c^T x \\)
- **Constraints**: \\( Ax \\leq b \\)
- **Non-negativity**: \\( x \\geq 0 \\)

### Why it matters

LP is the foundation of operations research. Many real-world problems—scheduling, routing, resource allocation—can be modeled as LPs and solved efficiently.`,
    published: true,
  },
  {
    title: "Duality and Shadow Prices",
    slug: "duality-shadow-prices",
    published_at: new Date(Date.now() - 86400000).toISOString(),
    excerpt: "Every LP has a dual. The dual variables give shadow prices for the constraints.",
    content: `## The dual problem

For every primal LP there is a corresponding **dual** LP. If the primal is a maximization, the dual is a minimization, and vice versa.

### Shadow prices

The optimal values of the dual variables are called **shadow prices**. They tell you how much the objective would improve if you relaxed that constraint by one unit.

### Complementary slackness

At optimality, for each constraint either the constraint is tight or the corresponding dual variable is zero. This is complementary slackness.`,
    published: true,
  },
];

async function seed() {
  for (const post of posts) {
    const { error } = await supabase.from("posts").upsert(post, {
      onConflict: "slug",
    });
    if (error) {
      console.error("Error seeding post:", post.slug, error);
      process.exit(1);
    }
    console.log("Seeded:", post.slug);
  }
  console.log("Done. Seeded", posts.length, "posts.");
}

seed();
