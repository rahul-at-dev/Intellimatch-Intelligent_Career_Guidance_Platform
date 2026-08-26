/**
 * Seeds PostgreSQL via Prisma with the same demo dataset the FastAPI in-memory
 * store uses (apps/api/app/data/*.py), so the two stay consistent when a real
 * Postgres instance is wired in.
 *
 * Run: npx prisma db seed  (requires DATABASE_URL and `prisma generate` first)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SKILLS = [
  "Python", "Java", "JavaScript", "TypeScript", "Go", "C++", "SQL",
  "React", "Next.js", "Vue.js", "Tailwind CSS", "Node.js", "FastAPI", "Django",
  "Spring Boot", "REST APIs", "GraphQL", "Microservices", "Docker", "Kubernetes",
  "AWS", "Azure", "GCP", "Terraform", "CI/CD", "PostgreSQL", "MongoDB", "Redis",
  "Elasticsearch", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow",
  "scikit-learn", "NLP", "LLM Engineering", "Data Engineering", "Apache Kafka",
  "Apache Spark", "System Design", "Testing", "Git", "Agile", "Security",
  "Product Management", "UI/UX Design",
];

const JOBS = [
  { id: "job-001", title: "Backend Engineer", company: "Nimbus Cloud Systems", location: "Bangalore", remote: true, seniority: "Mid", salaryMin: 1400000, salaryMax: 2200000, description: "Build scalable REST APIs and microservices.", skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs"] },
  { id: "job-003", title: "Full Stack Developer", company: "Vertex Retail Tech", location: "Chennai", remote: false, seniority: "Mid", salaryMin: 1200000, salaryMax: 1900000, description: "Ship features across Next.js and Node.js.", skills: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL"] },
  { id: "job-004", title: "ML Engineer", company: "Orbital AI Labs", location: "Remote", remote: true, seniority: "Mid", salaryMin: 1800000, salaryMax: 2800000, description: "Build and deploy ranking models.", skills: ["Python", "Machine Learning", "scikit-learn", "PyTorch", "Data Engineering"] },
];

async function main() {
  for (const name of SKILLS) {
    await prisma.skill.upsert({ where: { name }, update: {}, create: { name, synonyms: [] } });
  }

  const user = await prisma.user.upsert({
    where: { clerkId: "demo-clerk-id" },
    update: {},
    create: {
      clerkId: "demo-clerk-id",
      email: "candidate@intellimatch.ai",
      role: "CANDIDATE",
      profile: {
        create: {
          fullName: "Aditi Sharma",
          currentRole: "Backend Engineer",
          targetRole: "Senior Backend Engineer",
          location: "Bangalore",
          yearsExperience: 3.5,
          profileStrength: 49,
        },
      },
    },
    include: { profile: true },
  });

  for (const job of JOBS) {
    const created = await prisma.job.upsert({
      where: { id: job.id },
      update: {},
      create: {
        id: job.id, title: job.title, company: job.company, location: job.location,
        remote: job.remote, seniority: job.seniority, salaryMin: job.salaryMin,
        salaryMax: job.salaryMax, description: job.description, source: "seed",
      },
    });
    for (const skillName of job.skills) {
      const skill = await prisma.skill.findUnique({ where: { name: skillName } });
      if (!skill) continue;
      await prisma.jobSkill.upsert({
        where: { jobId_skillId: { jobId: created.id, skillId: skill.id } },
        update: {},
        create: { jobId: created.id, skillId: skill.id, required: true, minLevel: 3.0 },
      });
    }
  }

  console.log(`Seeded ${SKILLS.length} skills, ${JOBS.length} jobs, user ${user.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
