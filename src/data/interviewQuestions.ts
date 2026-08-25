// Interview Focus Questions Data

export interface InterviewQuestion {
  id: number;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface InterviewTopic {
  id: number;
  topic: string;
  description: string;
  icon: string;
  questionCount: number;
  questions: InterviewQuestion[];
}

export const interviewTopics: InterviewTopic[] = [
  {
    id: 1,
    topic: "Technical Skills Assessment",
    description: "Core programming, frameworks, and technologies",
    icon: "Code2",
    questionCount: 35,
    questions: [
      { id: 1, question: "Explain synchronous vs asynchronous programming.", difficulty: "easy" },
      { id: 2, question: "What is REST and its core principles?", difficulty: "easy" },
      { id: 3, question: "Difference between HTTP and HTTPS?", difficulty: "easy" },
      { id: 4, question: "What are closures?", difficulty: "medium" },
      { id: 5, question: "How does garbage collection work?", difficulty: "medium" },
      { id: 6, question: "What is dependency injection?", difficulty: "medium" },
      { id: 7, question: "SQL vs NoSQL databases?", difficulty: "easy" },
      { id: 8, question: "How do indexes improve performance?", difficulty: "medium" },
      { id: 9, question: "What is a memory leak?", difficulty: "medium" },
      { id: 10, question: "Authentication vs Authorization?", difficulty: "easy" },
      { id: 11, question: "What is JWT?", difficulty: "medium" },
      { id: 12, question: "How do you handle errors in production?", difficulty: "medium" },
      { id: 13, question: "What is CORS?", difficulty: "medium" },
      { id: 14, question: "Explain MVC architecture.", difficulty: "easy" },
      { id: 15, question: "How do you optimize application performance?", difficulty: "medium" },
      { id: 16, question: "What are webhooks?", difficulty: "medium" },
      { id: 17, question: "PUT vs PATCH?", difficulty: "easy" },
      { id: 18, question: "What are race conditions?", difficulty: "hard" },
      { id: 19, question: "How do you secure a REST API?", difficulty: "hard" },
      { id: 20, question: "Explain event-driven architecture.", difficulty: "medium" },
      { id: 21, question: "Promises vs callbacks?", difficulty: "easy" },
      { id: 22, question: "What is rate limiting?", difficulty: "medium" },
      { id: 23, question: "How do you secure config secrets?", difficulty: "easy" },
      { id: 24, question: "Optimistic vs pessimistic locking?", difficulty: "medium" },
      { id: 25, question: "What is API idempotency?", difficulty: "medium" },
      { id: 26, question: "Memory cache vs disk cache?", difficulty: "easy" },
      { id: 27, question: "What is a reverse proxy?", difficulty: "easy" },
      { id: 28, question: "How do you prevent SQL injection?", difficulty: "easy" },
      { id: 29, question: "API versioning strategies?", difficulty: "medium" },
      { id: 30, question: "What is a deadlock?", difficulty: "medium" },
      { id: 31, question: "Stateless vs stateful services?", difficulty: "easy" },
      { id: 32, question: "How do you handle large file uploads?", difficulty: "medium" },
      { id: 33, question: "What is OAuth?", difficulty: "medium" },
      { id: 34, question: "How do you monitor application health?", difficulty: "medium" },
      { id: 35, question: "Explain environment variables.", difficulty: "easy" }
    ]
  },

  {
    id: 2,
    topic: "System Design & Architecture",
    description: "Scalability, architecture patterns, and databases",
    icon: "Layers",
    questionCount: 25,
    questions: [
      { id: 1, question: "Design a URL shortening service.", difficulty: "medium" },
      { id: 2, question: "Horizontal vs vertical scaling?", difficulty: "easy" },
      { id: 3, question: "Monolith vs microservices?", difficulty: "easy" },
      { id: 4, question: "What is a load balancer?", difficulty: "easy" },
      { id: 5, question: "Design a notification system.", difficulty: "medium" },
      { id: 6, question: "Normalization vs denormalization?", difficulty: "medium" },
      { id: 7, question: "Handle millions of users?", difficulty: "hard" },
      { id: 8, question: "What is caching?", difficulty: "easy" },
      { id: 9, question: "Explain CAP theorem.", difficulty: "medium" },
      { id: 10, question: "Design a file upload system.", difficulty: "medium" },
      { id: 11, question: "What is eventual consistency?", difficulty: "medium" },
      { id: 12, question: "Fault tolerance strategies?", difficulty: "hard" },
      { id: 13, question: "Message queues use cases?", difficulty: "medium" },
      { id: 14, question: "Database migrations?", difficulty: "medium" },
      { id: 15, question: "Design trade-offs?", difficulty: "hard" },
      { id: 16, question: "Design a search system.", difficulty: "medium" },
      { id: 17, question: "Sharding vs partitioning?", difficulty: "medium" },
      { id: 18, question: "How CDNs work?", difficulty: "easy" },
      { id: 19, question: "Rate-limited API design?", difficulty: "medium" },
      { id: 20, question: "Design a chat application.", difficulty: "hard" },
      { id: 21, question: "Blue-green deployment?", difficulty: "easy" },
      { id: 22, question: "Rolling deployments?", difficulty: "easy" },
      { id: 23, question: "Multi-tenant system design?", difficulty: "hard" },
      { id: 24, question: "Config management across envs?", difficulty: "medium" },
      { id: 25, question: "Strong vs eventual consistency?", difficulty: "hard" }
    ]
  },

  {
    id: 3,
    topic: "Problem Solving & Algorithms",
    description: "Data structures and algorithmic thinking",
    icon: "Brain",
    questionCount: 25,
    questions: [
      { id: 1, question: "Explain time complexity.", difficulty: "easy" },
      { id: 2, question: "Array vs linked list?", difficulty: "easy" },
      { id: 3, question: "Stack vs queue use cases?", difficulty: "easy" },
      { id: 4, question: "Detect cycle in linked list?", difficulty: "medium" },
      { id: 5, question: "Recursion pros and cons?", difficulty: "medium" },
      { id: 6, question: "Binary search?", difficulty: "easy" },
      { id: 7, question: "What is hashing?", difficulty: "medium" },
      { id: 8, question: "BFS vs DFS?", difficulty: "medium" },
      { id: 9, question: "Optimize slow algorithms?", difficulty: "medium" },
      { id: 10, question: "Dynamic programming example?", difficulty: "hard" },
      { id: 11, question: "Greedy algorithms?", difficulty: "medium" },
      { id: 12, question: "Handling large inputs?", difficulty: "medium" },
      { id: 13, question: "Space complexity?", difficulty: "easy" },
      { id: 14, question: "Heap usage?", difficulty: "medium" },
      { id: 15, question: "Explain sliding window.", difficulty: "medium" },
      { id: 16, question: "Two-pointer technique?", difficulty: "medium" },
      { id: 17, question: "What is memoization?", difficulty: "medium" },
      { id: 18, question: "Topological sorting?", difficulty: "hard" },
      { id: 19, question: "Amortized analysis?", difficulty: "hard" },
      { id: 20, question: "Shortest path algorithms?", difficulty: "medium" },
      { id: 21, question: "Trie data structure?", difficulty: "medium" },
      { id: 22, question: "Binary tree traversals?", difficulty: "easy" },
      { id: 23, question: "What is backtracking?", difficulty: "medium" },
      { id: 24, question: "Describe algorithm optimization you did.", difficulty: "hard" },
      { id: 25, question: "How do you choose data structures?", difficulty: "medium" }
    ]
  },

  {
    id: 4,
    topic: "Behavioral & Soft Skills",
    description: "Teamwork, communication, and conflict resolution",
    icon: "Users",
    questionCount: 25,
    questions: [
      { id: 1, question: "Describe a challenging team situation.", difficulty: "easy" },
      { id: 2, question: "Handling team conflicts?", difficulty: "easy" },
      { id: 3, question: "Describe a failure and lesson learned.", difficulty: "easy" },
      { id: 4, question: "Handling tight deadlines?", difficulty: "easy" },
      { id: 5, question: "Giving and receiving feedback?", difficulty: "medium" },
      { id: 6, question: "Learning something quickly?", difficulty: "medium" },
      { id: 7, question: "Task prioritization?", difficulty: "easy" },
      { id: 8, question: "Handling stress?", difficulty: "easy" },
      { id: 9, question: "Leadership experience?", difficulty: "medium" },
      { id: 10, question: "Conflict resolution approach?", difficulty: "medium" },
      { id: 11, question: "Handling disagreement with decisions?", difficulty: "medium" },
      { id: 12, question: "Responding to criticism?", difficulty: "easy" },
      { id: 13, question: "Remote collaboration?", difficulty: "medium" },
      { id: 14, question: "Adapting to change?", difficulty: "easy" },
      { id: 15, question: "What motivates you?", difficulty: "easy" },
      { id: 16, question: "Managing difficult stakeholders?", difficulty: "medium" },
      { id: 17, question: "Taking ownership example?", difficulty: "medium" },
      { id: 18, question: "Balancing speed vs quality?", difficulty: "medium" },
      { id: 19, question: "Mentoring experience?", difficulty: "easy" },
      { id: 20, question: "Handling ambiguity?", difficulty: "medium" },
      { id: 21, question: "Professionalism definition?", difficulty: "easy" },
      { id: 22, question: "Managing feedback loops?", difficulty: "medium" },
      { id: 23, question: "Collaboration challenges?", difficulty: "medium" },
      { id: 24, question: "Handling pressure situations?", difficulty: "easy" },
      { id: 25, question: "Personal growth strategy?", difficulty: "easy" }
    ]
  },

  {
    id: 5,
    topic: "Project Experience Deep-Dive",
    description: "Past projects, challenges, and outcomes",
    icon: "Briefcase",
    questionCount: 20,
    questions: [
      { id: 1, question: "Describe your most impactful project.", difficulty: "easy" },
      { id: 2, question: "Problem the project solved?", difficulty: "easy" },
      { id: 3, question: "Your role in the project?", difficulty: "easy" },
      { id: 4, question: "Biggest technical challenge?", difficulty: "medium" },
      { id: 5, question: "Handling project failures?", difficulty: "medium" },
      { id: 6, question: "Key design decisions?", difficulty: "medium" },
      { id: 7, question: "Testing strategy used?", difficulty: "medium" },
      { id: 8, question: "Improvements if rebuilt?", difficulty: "medium" },
      { id: 9, question: "Team collaboration?", difficulty: "easy" },
      { id: 10, question: "Scope change handling?", difficulty: "medium" },
      { id: 11, question: "Technology choices?", difficulty: "medium" },
      { id: 12, question: "Performance optimizations?", difficulty: "hard" },
      { id: 13, question: "Scalability considerations?", difficulty: "hard" },
      { id: 14, question: "User feedback received?", difficulty: "easy" },
      { id: 15, question: "Lessons learned?", difficulty: "easy" },
      { id: 16, question: "Deployment process?", difficulty: "medium" },
      { id: 17, question: "Security considerations?", difficulty: "medium" },
      { id: 18, question: "Monitoring approach?", difficulty: "medium" },
      { id: 19, question: "Production issues faced?", difficulty: "hard" },
      { id: 20, question: "Biggest project risk?", difficulty: "medium" }
    ]
  },

  {
    id: 6,
    topic: "Domain Knowledge",
    description: "Industry-specific knowledge",
    icon: "BookOpen",
    questionCount: 15,
    questions: [
      { id: 1, question: "Current trends in your domain?", difficulty: "medium" },
      { id: 2, question: "Industry challenges?", difficulty: "medium" },
      { id: 3, question: "Technology impact on industry?", difficulty: "easy" },
      { id: 4, question: "Success metrics in this role?", difficulty: "medium" },
      { id: 5, question: "How do you stay updated?", difficulty: "easy" },
      { id: 6, question: "Domain tools used?", difficulty: "easy" },
      { id: 7, question: "Regulatory considerations?", difficulty: "medium" },
      { id: 8, question: "Handling domain risks?", difficulty: "hard" },
      { id: 9, question: "Domain problem solved?", difficulty: "medium" },
      { id: 10, question: "Future domain trends?", difficulty: "easy" },
      { id: 11, question: "Industry best practices?", difficulty: "medium" },
      { id: 12, question: "Domain-specific KPIs?", difficulty: "medium" },
      { id: 13, question: "Common industry failures?", difficulty: "medium" },
      { id: 14, question: "Impact of automation?", difficulty: "easy" },
      { id: 15, question: "Ethical concerns in domain?", difficulty: "medium" }
    ]
  },

  {
    id: 7,
    topic: "Culture Fit & Motivation",
    description: "Career goals and value alignment",
    icon: "Heart",
    questionCount: 15,
    questions: [
      { id: 1, question: "Why do you want to work here?", difficulty: "easy" },
      { id: 2, question: "What values matter to you?", difficulty: "easy" },
      { id: 3, question: "Where do you see yourself in 5 years?", difficulty: "easy" },
      { id: 4, question: "Preferred work environment?", difficulty: "easy" },
      { id: 5, question: "Handling ambiguity?", difficulty: "medium" },
      { id: 6, question: "Motivation beyond salary?", difficulty: "easy" },
      { id: 7, question: "Ideal team description?", difficulty: "easy" },
      { id: 8, question: "Aligning goals with company?", difficulty: "medium" },
      { id: 9, question: "Reason to leave a company?", difficulty: "medium" },
      { id: 10, question: "Definition of success?", difficulty: "easy" },
      { id: 11, question: "Handling ethical dilemmas?", difficulty: "medium" },
      { id: 12, question: "Company culture importance?", difficulty: "easy" },
      { id: 13, question: "Feedback culture preference?", difficulty: "easy" },
      { id: 14, question: "Growth expectations?", difficulty: "easy" },
      { id: 15, question: "Long-term commitment factors?", difficulty: "medium" }
    ]
  }
];
