// Auto-generated 40 System Design Questions
export const SYSTEM_DESIGN_QUESTIONS: Record<string, any[]> = {
  "backend": [
    {
      "id": "sd_backend_0_1",
      "title": "Design a Distributed Rate Limiter",
      "category": "backend",
      "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
      "keyDiscussionPoints": [
        "Token Bucket vs Sliding Window algorithms",
        "Redis Lua script atomicity",
        "Handling multi-region replication lag"
      ]
    },
    {
      "id": "sd_backend_1_1",
      "title": "Design a Scalable Multi-User Chat System",
      "category": "backend",
      "prompt": "Design a real-time multi-user chat system that allows thousands of concurrent users to send and receive messages, with the ability to search and retrieve previous messages.",
      "keyDiscussionPoints": [
        "Real-time messaging using WebSockets or message queues",
        "Distributed message storage and indexing",
        "Scalable search functionality"
      ]
    },
    {
      "id": "sd_backend_2_1",
      "title": "Design a High-Throughput File Processing System",
      "category": "backend",
      "prompt": "Design a high-throughput file processing system that can process millions of files per day, with the ability to handle failures and recover from them.",
      "keyDiscussionPoints": [
        "Distributed file processing using worker queues",
        "Fault-tolerant storage using object storage",
        "Monitoring and alerting for system failures"
      ]
    },
    {
      "id": "sd_backend_3_1",
      "title": "Design a Personalized Product Recommendation System",
      "category": "backend",
      "prompt": "Design a personalized product recommendation system that suggests products to users based on their past purchases and browsing history.",
      "keyDiscussionPoints": [
        "Collaborative filtering vs content-based filtering",
        "Distributed data storage using graph databases",
        "Scalable recommendation algorithm using matrix factorization"
      ]
    },
    {
      "id": "sd_backend_4_1",
      "title": "Design a High-Availability E-commerce Payment Gateway",
      "category": "backend",
      "prompt": "Design a high-availability e-commerce payment gateway that can handle millions of transactions per day, with the ability to recover from failures and ensure secure payment processing.",
      "keyDiscussionPoints": [
        "Distributed payment processing using message queues",
        "Secure payment storage using Hardware Security Modules (HSMs)",
        "Monitoring and alerting for payment failures"
      ]
    },
    {
      "id": "sd_backend_1_1",
      "title": "Design a Distributed Rate Limiter",
      "category": "backend",
      "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
      "keyDiscussionPoints": [
        "Token Bucket vs Sliding Window algorithms",
        "Redis Lua script atomicity",
        "Handling multi-region replication lag"
      ]
    },
    {
      "id": "sd_backend_2_1",
      "title": "Design a Scalable User Profile Service",
      "category": "backend",
      "prompt": "Design a system to store and retrieve user profiles in real-time, handling 100,000 requests/second with 99.99% uptime.",
      "keyDiscussionPoints": [
        "Cache layer architecture",
        "Consistency model for profile updates",
        "Sharding strategy for user profiles"
      ]
    },
    {
      "id": "sd_backend_3_1",
      "title": "Design a Payment Gateway for an E-commerce Platform",
      "category": "backend",
      "prompt": "Design a payment gateway that accepts multiple payment methods (e.g. credit cards, PayPal) and supports real-time payment processing, with 99.99% uptime.",
      "keyDiscussionPoints": [
        "Architecture for handling payment requests",
        "Security measures for sensitive payment data",
        "Escalation procedures for payment failures"
      ]
    },
    {
      "id": "sd_backend_4_1",
      "title": "Design a System for Real-time Analytics and Reporting",
      "category": "backend",
      "prompt": "Design a system to collect and process user interactions (e.g. clicks, page views) and generate real-time reports, with 99.99% uptime.",
      "keyDiscussionPoints": [
        "Data pipeline architecture",
        "Real-time data processing and aggregation",
        "Data visualization and reporting tools"
      ]
    },
    {
      "id": "sd_backend_5_1",
      "title": "Design a Notification System for a Mobile App",
      "category": "backend",
      "prompt": "Design a system to send push notifications to mobile devices in real-time, with 99.99% uptime and low latency.",
      "keyDiscussionPoints": [
        "Message queue architecture",
        "Notification routing and prioritization",
        "Handling notification retries and failures"
      ]
    },
    {
      "id": "sd_backend_1_1",
      "title": "Design a Highly Scalable E-commerce Payment Gateway",
      "category": "backend",
      "prompt": "Design a highly scalable payment gateway that supports multiple payment providers (e.g. Stripe, PayPal), real-time transaction processing, and seamless integration with various e-commerce platforms.",
      "keyDiscussionPoints": [
        "Microservices architecture",
        "Message Queue integration (e.g. RabbitMQ, Apache Kafka)",
        "Security and encryption measures for sensitive payment information"
      ]
    },
    {
      "id": "sd_backend_2_1",
      "title": "Design a Distributed Rate Limiter",
      "category": "backend",
      "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
      "keyDiscussionPoints": [
        "Token Bucket vs Sliding Window algorithms",
        "Redis Lua script atomicity",
        "Handling multi-region replication lag"
      ]
    },
    {
      "id": "sd_backend_3_1",
      "title": "Design a Real-time Analytics Platform",
      "category": "backend",
      "prompt": "Design a real-time analytics platform that ingests data from various sources (e.g. logs, sensors, APIs), processes it in near real-time, and provides insights through a user-friendly dashboard.",
      "keyDiscussionPoints": [
        "Streaming data processing (e.g. Apache Kafka, Apache Flink)",
        "Distributed storage solutions (e.g. Cassandra, HBase)",
        "Data aggregation and visualization techniques"
      ]
    },
    {
      "id": "sd_backend_4_1",
      "title": "Design a Highly Available API Gateway",
      "category": "backend",
      "prompt": "Design a highly available API gateway that supports load balancing, caching, and security features, while providing a unified entry point for multiple microservices.",
      "keyDiscussionPoints": [
        "Load balancing algorithms (e.g. round-robin, least connections)",
        "Caching mechanisms (e.g. Redis, Memcached)",
        "Authentication and authorization strategies"
      ]
    },
    {
      "id": "sd_backend_5_1",
      "title": "Design a Distributed Search Engine",
      "category": "backend",
      "prompt": "Design a distributed search engine that indexes and retrieves data from a large corpus, supports faceting, filtering, and sorting, and scales horizontally to handle high query volumes.",
      "keyDiscussionPoints": [
        "Data indexing and querying (e.g. Elasticsearch, Solr)",
        "Distributed data storage solutions (e.g. HBase, Cassandra)",
        "Query optimization and caching techniques"
      ]
    }
  ],
  "frontend": [
    {
      "id": "sd_frontend_1_1",
      "title": "Design a Scalable Real-time Typing Indicator",
      "category": "frontend",
      "prompt": "Design a real-time typing indicator that shows users when friends are typing a message in a chat app. The indicator should be displayed in the user's chat list, and should update in real-time as friends type.",
      "keyDiscussionPoints": [
        "WebSockets vs WebRTC for real-time communication",
        "Optimizing performance for large user bases",
        "Handling user disconnections and reconnects"
      ]
    },
    {
      "id": "sd_frontend_2_1",
      "title": "Design a Personalized Content Feed",
      "category": "frontend",
      "prompt": "Design a personalized content feed that aggregates posts from friends, family, and influencers, and presents them in a visually appealing manner. The feed should adapt to the user's preferences and behavior over time.",
      "keyDiscussionPoints": [
        "Algorithm for content ranking and filtering",
        "Handling infinite scrolling and pagination",
        "Integrating with social media APIs for content sourcing"
      ]
    },
    {
      "id": "sd_frontend_3_1",
      "title": "Design a Distributed Rate Limiter",
      "category": "frontend",
      "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
      "keyDiscussionPoints": [
        "Token Bucket vs Sliding Window algorithms",
        "Redis Lua script atomicity",
        "Handling multi-region replication lag"
      ]
    },
    {
      "id": "sd_frontend_4_1",
      "title": "Design an In-app Notification System",
      "category": "frontend",
      "prompt": "Design an in-app notification system that provides users with timely and relevant notifications about app updates, promotions, and system events. The notifications should be customizable and dismissible.",
      "keyDiscussionPoints": [
        "Notification types and prioritization",
        "Handling notification storage and retrieval",
        "Optimizing for mobile devices and low-bandwidth networks"
      ]
    },
    {
      "id": "sd_frontend_5_1",
      "title": "Design a Collaborative Drawing Tool",
      "category": "frontend",
      "prompt": "Design a collaborative drawing tool that allows multiple users to create and edit a single drawing in real-time. The tool should support various drawing tools, such as brushes, shapes, and text.",
      "keyDiscussionPoints": [
        "Real-time synchronization and conflict resolution",
        "Handling user input and event propagation",
        "Optimizing for multiple concurrent users"
      ]
    },
    {
      "id": "sd_frontend_1_1",
      "title": "Design a Scalable Live Update Feature for a Real-time Chat App",
      "category": "frontend",
      "prompt": "Design a system that allows live updates to a chat room for thousands of concurrent users, with 99.99% uptime and < 1 second latency.",
      "keyDiscussionPoints": [
        "WebSockets vs WebRTC for real-time updates",
        "Cache invalidation strategies for fast updates",
        "Scalable architecture for handling high traffic"
      ]
    },
    {
      "id": "sd_frontend_2_1",
      "title": "Design a Fast and Efficient Image Upload System",
      "category": "frontend",
      "prompt": "Design a system that allows users to upload high-quality images with fast upload speed, and efficient storage and serving.",
      "keyDiscussionPoints": [
        "CDN vs Cloud Storage for image serving",
        "Image compression algorithms for efficient storage",
        "Scalable architecture for handling high upload volume"
      ]
    },
    {
      "id": "sd_frontend_3_1",
      "title": "Design a Collaborative Browser Extension for Real-time Co-browsing",
      "category": "frontend",
      "prompt": "Design a browser extension that allows multiple users to collaboratively browse a website in real-time, with features like simultaneous scrolling and cursor tracking.",
      "keyDiscussionPoints": [
        "WebRTC for real-time co-browsing",
        "Scalable architecture for handling multiple users",
        "Security considerations for shared browsing"
      ]
    },
    {
      "id": "sd_frontend_4_1",
      "title": "Design a Distributed Rate Limiter",
      "category": "frontend",
      "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
      "keyDiscussionPoints": [
        "Token Bucket vs Sliding Window algorithms",
        "Redis Lua script atomicity",
        "Handling multi-region replication lag"
      ]
    },
    {
      "id": "sd_frontend_5_1",
      "title": "Design a Dynamic and Customizable Theme System for a Web Application",
      "category": "frontend",
      "prompt": "Design a system that allows users to dynamically switch between custom themes, with features like automatic theme switching based on user preferences and adaptive theme rendering for different devices.",
      "keyDiscussionPoints": [
        "Theme data storage strategies (e.g., database vs file storage)",
        "Scalable architecture for handling high theme requests",
        "Performance considerations for theme rendering"
      ]
    },
    {
      "id": "sd_frontend_5_1",
      "title": "Design a Distributed Rate Limiter",
      "category": "frontend",
      "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
      "keyDiscussionPoints": [
        "Token Bucket vs Sliding Window algorithms",
        "Redis Lua script atomicity",
        "Handling multi-region replication lag"
      ]
    },
    {
      "id": "sd_frontend_5_2",
      "title": "Design a Realtime Search Bar",
      "category": "frontend",
      "prompt": "Design a search bar that provides real-time suggestions as users type, with a latency of less than 50ms, while handling a traffic of 10,000 concurrent users.",
      "keyDiscussionPoints": [
        "Cache invalidation strategies",
        "Async vs Sync data fetching approaches",
        "Scalability of autocomplete algorithms"
      ]
    },
    {
      "id": "sd_frontend_5_3",
      "title": "Design a Personalized News Feed",
      "category": "frontend",
      "prompt": "Design a news feed that personalized content based on user interests, with a refresh rate of 1 hour, and handles a user base of 1 million.",
      "keyDiscussionPoints": [
        "Hybrid recommendation algorithms (user behavior + content analysis)",
        "Content delivery network (CDN) optimization",
        "Distributed caching for frequent content updates"
      ]
    },
    {
      "id": "sd_frontend_5_4",
      "title": "Design an Image Compression Service",
      "category": "frontend",
      "prompt": "Design an image compression service that reduces image sizes by 70% while preserving quality, with a request rate of 10,000/sec.",
      "keyDiscussionPoints": [
        "Lossless vs Lossy compression algorithms",
        "Async processing with task queues",
        "Scalability of image resizing and encoding"
      ]
    },
    {
      "id": "sd_frontend_5_5",
      "title": "Design a Collaborative Realtime Chat",
      "category": "frontend",
      "prompt": "Design a real-time chat application that allows multiple users to collaborate on a single chat thread, with a latency of less than 1 second, and handles a concurrent user base of 50,000.",
      "keyDiscussionPoints": [
        "WebSocket or WebRTC for real-time communication",
        "Conflict resolution strategies for concurrent updates",
        "Distributed locking for thread-safe updates"
      ]
    }
  ],
  "fullstack": [
    {
      "id": "sd_fullstack_6_1",
      "title": "Design a Distributed Rate Limiter",
      "category": "fullstack",
      "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
      "keyDiscussionPoints": [
        "Token Bucket vs Sliding Window algorithms",
        "Redis Lua script atomicity",
        "Handling multi-region replication lag"
      ]
    },
    {
      "id": "sd_fullstack_7_1",
      "title": "Design a Scalable Real-time Event Feed",
      "category": "fullstack",
      "prompt": "Design a system to collect and display real-time event feeds from multiple sources, handling 1000 events/sec with a latency of less than 100ms.",
      "keyDiscussionPoints": [
        "Event ingestion and normalization",
        "Distributed log aggregation using Apache Kafka",
        "WebSockets or Webhooks for real-time updates"
      ]
    },
    {
      "id": "sd_fullstack_8_1",
      "title": "Design a Microblogging Platform with Infinite Scroll",
      "category": "fullstack",
      "prompt": "Design a microblogging platform with features like infinite scroll, user profiles, and hashtags, handling 10,000 concurrent users with an average of 5 posts/sec.",
      "keyDiscussionPoints": [
        "Database indexing for efficient query performance",
        "Caching strategies for reducing database load",
        "Implementing infinite scroll with pagination"
      ]
    },
    {
      "id": "sd_fullstack_9_1",
      "title": "Design a Secure File Sharing Platform",
      "category": "fullstack",
      "prompt": "Design a secure file sharing platform that supports file upload, download, and sharing with end-to-end encryption and access control.",
      "keyDiscussionPoints": [
        "Client-side vs Server-side encryption",
        "Implementing role-based access control with RBAC",
        "Secure file storage using Amazon S3"
      ]
    },
    {
      "id": "sd_fullstack_10_1",
      "title": "Design a High-Availability Online Multiplayer Game",
      "category": "fullstack",
      "prompt": "Design a high-availability online multiplayer game that supports 10,000 concurrent users with a latency of less than 50ms and a failure rate of < 0.01%.",
      "keyDiscussionPoints": [
        "Distributed leader election using Raft or ZooKeeper",
        "Game state synchronization with vector clocks",
        "Load balancing and auto-scaling strategies"
      ]
    },
    {
      "id": "sd_fullstack_7_1",
      "title": "Design a Distributed Rate Limiter",
      "category": "fullstack",
      "prompt": "Design a highly available distributed rate limiter that restricts API requests per user to 100/min across global regions.",
      "keyDiscussionPoints": [
        "Token Bucket vs Sliding Window algorithms",
        "Redis Lua script atomicity",
        "Handling multi-region replication lag"
      ]
    },
    {
      "id": "sd_fullstack_8_1",
      "title": "Design a Scalable Online Forum System",
      "category": "fullstack",
      "prompt": "Design an online forum system that supports 10M+ users, with features like user authentication, post comments, and real-time updates. Ensure that the system can handle sudden spikes in traffic and scale horizontally.",
      "keyDiscussionPoints": [
        "Caching strategies for high-traffic pages",
        "Database schema design for concurrent posting and commenting",
        "Real-time update implementation using WebSockets"
      ]
    },
    {
      "id": "sd_fullstack_9_1",
      "title": "Design a High-Performance Image Processing Service",
      "category": "fullstack",
      "prompt": "Design an image processing service that can handle 1000s of concurrent requests, resizing and compressing images in real-time. The service must be able to handle varying image sizes and formats.",
      "keyDiscussionPoints": [
        "Parallel processing using worker queues",
        "Image compression algorithms for optimal storage",
        "Load balancing and autoscaling for high-availability"
      ]
    },
    {
      "id": "sd_fullstack_10_1",
      "title": "Design a Collaborative Real-Time Text Editor",
      "category": "fullstack",
      "prompt": "Design a real-time collaborative text editor that allows multiple users to edit the same document simultaneously. Ensure that the system can handle large documents and provide a seamless user experience.",
      "keyDiscussionPoints": [
        "WebSockets for real-time updates",
        "Conflict resolution strategies for concurrent edits",
        "Optimizing for low-latency and high-throughput"
      ]
    },
    {
      "id": "sd_fullstack_11_1",
      "title": "Design a Secure and Scalable E-commerce Platform",
      "category": "fullstack",
      "prompt": "Design an e-commerce platform that can handle 1000s of concurrent transactions, with features like payment processing, cart management, and order tracking. Ensure that the system is secure and scalable.",
      "keyDiscussionPoints": [
        "Payment gateway integration and security",
        "Database schema design for high-performance transactions",
        "Load balancing and autoscaling for high-availability"
      ]
    }
  ]
};
