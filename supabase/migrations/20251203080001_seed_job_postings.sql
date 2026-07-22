-- Seed job postings for testing
-- Run this after the migration to populate sample jobs

INSERT INTO job_postings (title, company, description, requirements, salary_range, location, remote_ok, experience_level, skills_required, application_url, source) VALUES

-- Software Engineering Roles
('Senior Software Engineer', 'Google', 'Join our team building next-generation cloud infrastructure. Work on distributed systems at scale.', 'BS in Computer Science or equivalent, 5+ years experience, strong system design skills', '$180k - $250k', 'Mountain View, CA', true, 'senior', '["Python", "Go", "Kubernetes", "System Design", "Distributed Systems"]'::jsonb, 'https://careers.google.com', 'ai-generated'),

('Full Stack Developer', 'Stripe', 'Build payment infrastructure for the internet. Work with React, Node.js, and modern web technologies.', '3+ years full-stack experience, proficiency in React and Node.js', '$140k - $200k', 'San Francisco, CA', true, 'mid', '["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs"]'::jsonb, 'https://stripe.com/jobs', 'ai-generated'),

('Frontend Engineer', 'Airbnb', 'Create beautiful user experiences for millions of travelers worldwide. Focus on React and modern frontend.', '2+ years frontend experience, strong React skills', '$130k - $180k', 'San Francisco, CA', true, 'mid', '["React", "JavaScript", "CSS", "HTML", "Redux"]'::jsonb, 'https://careers.airbnb.com', 'ai-generated'),

('Backend Engineer', 'Netflix', 'Build scalable microservices powering streaming for 200M+ subscribers.', '4+ years backend experience, Java or Python expertise', '$160k - $220k', 'Los Gatos, CA', false, 'senior', '["Java", "Python", "Microservices", "AWS", "Kafka"]'::jsonb, 'https://jobs.netflix.com', 'ai-generated'),

('Software Engineer - New Grad', 'Meta', 'Start your career at Meta working on products used by billions. Full-stack development opportunities.', 'BS/MS in Computer Science, strong coding skills', '$120k - $160k', 'Menlo Park, CA', false, 'entry', '["Python", "JavaScript", "React", "Data Structures", "Algorithms"]'::jsonb, 'https://metacareers.com', 'ai-generated'),

-- AI/ML Roles
('Machine Learning Engineer', 'OpenAI', 'Train and deploy large language models. Work on cutting-edge AI research.', 'MS/PhD in CS/ML, experience with PyTorch/TensorFlow, strong ML fundamentals', '$200k - $300k', 'San Francisco, CA', true, 'senior', '["Python", "PyTorch", "TensorFlow", "NLP", "Deep Learning"]'::jsonb, 'https://openai.com/careers', 'ai-generated'),

('AI Research Scientist', 'DeepMind', 'Conduct fundamental AI research. Publish papers and advance the state of the art.', 'PhD in Machine Learning or related field, strong publication record', '$220k - $350k', 'London, UK', false, 'senior', '["Python", "Research", "Deep Learning", "Reinforcement Learning", "Mathematics"]'::jsonb, 'https://deepmind.com/careers', 'ai-generated'),

('ML Engineer - Computer Vision', 'Tesla', 'Build autonomous driving systems. Work on perception and computer vision.', '3+ years ML experience, computer vision expertise', '$150k - $220k', 'Palo Alto, CA', false, 'mid', '["Python", "Computer Vision", "PyTorch", "C++", "CUDA"]'::jsonb, 'https://tesla.com/careers', 'ai-generated'),

-- Data Science Roles
('Data Scientist', 'Uber', 'Analyze data to improve rider and driver experiences. Build predictive models.', '2+ years data science experience, strong SQL and Python skills', '$130k - $180k', 'San Francisco, CA', true, 'mid', '["Python", "SQL", "Statistics", "Machine Learning", "Data Visualization"]'::jsonb, 'https://uber.com/careers', 'ai-generated'),

('Senior Data Analyst', 'Amazon', 'Drive business decisions through data analysis. Work with massive datasets.', '4+ years analytics experience, advanced SQL', '$120k - $170k', 'Seattle, WA', true, 'senior', '["SQL", "Python", "Tableau", "Statistics", "A/B Testing"]'::jsonb, 'https://amazon.jobs', 'ai-generated'),

-- Product Management
('Product Manager', 'Microsoft', 'Lead product strategy for Azure cloud services. Work with engineering and design teams.', '3+ years PM experience, technical background preferred', '$140k - $200k', 'Redmond, WA', true, 'mid', '["Product Strategy", "Agile", "User Research", "SQL", "Communication"]'::jsonb, 'https://careers.microsoft.com', 'ai-generated'),

('Senior Product Manager', 'Salesforce', 'Define product roadmap for CRM platform. Drive innovation in enterprise software.', '5+ years PM experience, B2B SaaS background', '$160k - $220k', 'San Francisco, CA', true, 'senior', '["Product Management", "B2B SaaS", "Roadmapping", "Stakeholder Management", "Analytics"]'::jsonb, 'https://salesforce.com/careers', 'ai-generated'),

-- DevOps/Cloud
('DevOps Engineer', 'Cloudflare', 'Build and maintain infrastructure serving 25M+ websites. Kubernetes and Terraform expertise.', '3+ years DevOps experience, strong Kubernetes skills', '$130k - $180k', 'Austin, TX', true, 'mid', '["Kubernetes", "Terraform", "AWS", "Docker", "CI/CD"]'::jsonb, 'https://cloudflare.com/careers', 'ai-generated'),

('Site Reliability Engineer', 'Datadog', 'Ensure 99.99% uptime for monitoring platform. Build automation and tooling.', '4+ years SRE experience, strong coding skills', '$150k - $210k', 'New York, NY', true, 'senior', '["Python", "Go", "Kubernetes", "Monitoring", "Incident Response"]'::jsonb, 'https://datadoghq.com/careers', 'ai-generated'),

('Cloud Architect', 'Oracle', 'Design cloud solutions for enterprise customers. Multi-cloud expertise required.', '6+ years cloud experience, architecture certifications', '$170k - $240k', 'Austin, TX', true, 'senior', '["AWS", "Azure", "GCP", "Architecture", "Security"]'::jsonb, 'https://oracle.com/careers', 'ai-generated'),

-- Security
('Security Engineer', 'CrowdStrike', 'Protect customers from cyber threats. Build security tools and respond to incidents.', '3+ years security experience, penetration testing skills', '$140k - $190k', 'Remote', true, 'mid', '["Cybersecurity", "Penetration Testing", "Python", "Network Security", "Incident Response"]'::jsonb, 'https://crowdstrike.com/careers', 'ai-generated'),

('Application Security Engineer', 'GitHub', 'Secure the platform used by 100M+ developers. Find and fix vulnerabilities.', '4+ years AppSec experience, secure coding expertise', '$150k - $200k', 'Remote', true, 'senior', '["Application Security", "SAST", "DAST", "Secure Coding", "Threat Modeling"]'::jsonb, 'https://github.com/careers', 'ai-generated'),

-- Mobile Development
('iOS Engineer', 'Spotify', 'Build the iOS app used by millions of music lovers. SwiftUI and modern iOS development.', '3+ years iOS development, strong Swift skills', '$130k - $180k', 'New York, NY', true, 'mid', '["Swift", "SwiftUI", "iOS", "UIKit", "REST APIs"]'::jsonb, 'https://spotify.com/careers', 'ai-generated'),

('Android Engineer', 'DoorDash', 'Create seamless food delivery experiences. Kotlin and Jetpack Compose.', '2+ years Android development', '$120k - $170k', 'San Francisco, CA', true, 'mid', '["Kotlin", "Android", "Jetpack Compose", "MVVM", "REST APIs"]'::jsonb, 'https://doordash.com/careers', 'ai-generated'),

('React Native Developer', 'Discord', 'Build cross-platform mobile apps for gaming communities.', '2+ years React Native experience', '$110k - $160k', 'San Francisco, CA', true, 'mid', '["React Native", "JavaScript", "TypeScript", "Mobile Development", "Redux"]'::jsonb, 'https://discord.com/jobs', 'ai-generated'),

-- Entry Level
('Junior Software Engineer', 'Shopify', 'Learn and grow with mentorship from senior engineers. Full-stack development.', 'BS in Computer Science, internship experience preferred', '$90k - $120k', 'Ottawa, Canada', true, 'entry', '["Ruby", "Rails", "JavaScript", "React", "SQL"]'::jsonb, 'https://shopify.com/careers', 'ai-generated'),

('Associate Data Scientist', 'LinkedIn', 'Start your data science career analyzing professional network data.', 'MS in Data Science or related field, Python and SQL skills', '$100k - $130k', 'Sunnyvale, CA', true, 'entry', '["Python", "SQL", "Statistics", "Machine Learning", "Pandas"]'::jsonb, 'https://linkedin.com/jobs', 'ai-generated'),

('Junior DevOps Engineer', 'Twilio', 'Learn cloud infrastructure and automation. Work with AWS and Kubernetes.', '1+ year experience or strong bootcamp background', '$85k - $115k', 'San Francisco, CA', true, 'entry', '["AWS", "Docker", "Linux", "Python", "CI/CD"]'::jsonb, 'https://twilio.com/careers', 'ai-generated'),

-- Design
('Product Designer', 'Figma', 'Design the future of collaborative design tools. Work on Figma itself.', '3+ years product design experience, strong portfolio', '$120k - $170k', 'San Francisco, CA', true, 'mid', '["Figma", "UI/UX Design", "Prototyping", "User Research", "Design Systems"]'::jsonb, 'https://figma.com/careers', 'ai-generated'),

('UX Researcher', 'Adobe', 'Conduct user research to inform product decisions. Mixed methods expertise.', '4+ years UX research experience', '$110k - $160k', 'San Jose, CA', true, 'senior', '["User Research", "Usability Testing", "Qualitative Research", "Quantitative Research", "Figma"]'::jsonb, 'https://adobe.com/careers', 'ai-generated');
