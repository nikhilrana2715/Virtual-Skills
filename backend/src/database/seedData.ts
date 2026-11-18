/**
 * Curated seed catalog. Only facts we are sure of (name, official URL, owner, type).
 * Stars / forks / license / last commit are left null on purpose — the GitHub sync job fills real values.
 */
export const CATEGORIES = [
  { slug: 'ai-machine-learning', name: 'AI & Machine Learning', icon: '🧠', description: 'Machine learning, deep learning, computer vision and NLP.' },
  { slug: 'generative-ai', name: 'Generative AI', icon: '✨', description: 'LLMs, multimodal, image, audio and video generation.' },
  { slug: 'ai-agents', name: 'AI Agents', icon: '🤖', description: 'Agent frameworks, multi-agent systems and coding agents.' },
  { slug: 'ai-skills-workflows', name: 'AI Skills & Workflows', icon: '🧩', description: 'Claude skills, agent skills, prompt packs and workflows.' },
  { slug: 'mcp-ecosystem', name: 'MCP Ecosystem', icon: '🔌', description: 'Model Context Protocol servers, clients and tools.' },
  { slug: 'rag-knowledge-systems', name: 'RAG & Knowledge Systems', icon: '📚', description: 'Retrieval, vector search, embeddings and document parsing.' },
  { slug: 'models-datasets', name: 'Models & Datasets', icon: '🗂️', description: 'Models, datasets and evaluation sets.' },
  { slug: 'data-science-analytics', name: 'Data Science & Analytics', icon: '📊', description: 'Python, notebooks, BI and data engineering.' },
  { slug: 'developer-tools', name: 'Developer Tools', icon: '🛠️', description: 'IDE extensions, CLIs, SDKs, APIs and libraries.' },
  { slug: 'web-development', name: 'Web Development', icon: '🌐', description: 'React, Next.js, Node.js and TypeScript.' },
  { slug: 'devops-cloud', name: 'DevOps & Cloud', icon: '☁️', description: 'Docker, Kubernetes, CI/CD and cloud platforms.' },
  { slug: 'security-reverse-engineering', name: 'Security & Reverse Engineering', icon: '🛡️', description: 'Static/binary analysis and debugging for defensive, authorized research.' },
  { slug: 'robotics-edge-ai', name: 'Robotics & Edge AI', icon: '🦾', description: 'Robotics, IoT and edge inference.' },
  { slug: 'research-papers', name: 'Research & Papers', icon: '📄', description: 'Paper implementations, benchmarks and reproducibility.' },
  // IT & Cloud
  { slug: 'cloud-infrastructure', name: 'Cloud Infrastructure & IaC', icon: '🏗️', description: 'Infrastructure as code, cloud CLIs and local cloud emulators.' },
  { slug: 'it-operations', name: 'IT Operations & Monitoring', icon: '📈', description: 'Metrics, dashboards, uptime checks, observability and configuration management.' },
  { slug: 'it-service-management', name: 'IT Service & Asset Management', icon: '🗃️', description: 'Helpdesk, ticketing, IT asset inventory and service desks.' },
  { slug: 'networking', name: 'Networking & Proxies', icon: '🔀', description: 'Web servers, reverse proxies, VPN/mesh networking and DNS.' },
  { slug: 'databases-storage', name: 'Databases & Storage', icon: '🗄️', description: 'Relational, in-memory and analytical databases plus object storage.' },
  { slug: 'cybersecurity-defense', name: 'Cybersecurity & Compliance', icon: '🔒', description: 'Vulnerability scanning, secret detection, SIEM, runtime security and hardening audits.' },
  { slug: 'automation-integration', name: 'Automation & Integration', icon: '⚙️', description: 'Workflow automation, job orchestration and app integration platforms.' },
];

interface Seed {
  repo: string;
  name?: string;
  type: string;
  category: string;
  summary: string;
  tags: string[];
  language?: string;
  installation?: string;
  official?: boolean;
}

export const RESOURCES: Seed[] = [
  { repo: 'anthropics/skills', type: 'skill', category: 'ai-skills-workflows', official: true, summary: 'Official collection of Agent Skills for Claude — packaged instructions, scripts and resources Claude loads on demand.', tags: ['Claude Skills', 'Agent Skills', 'Anthropic'] },
  { repo: 'anthropics/claude-code', type: 'tool', category: 'developer-tools', official: true, summary: 'Agentic coding tool that lives in your terminal, understands your codebase and helps you code faster.', tags: ['Coding Agents', 'CLI', 'Anthropic'], installation: 'npm install -g @anthropic-ai/claude-code' },
  { repo: 'anthropics/anthropic-sdk-python', name: 'Anthropic Python SDK', type: 'library', category: 'developer-tools', official: true, summary: 'Official Python library for the Claude API.', tags: ['SDK', 'API', 'LLM'], language: 'Python', installation: 'pip install anthropic' },
  { repo: 'modelcontextprotocol/servers', name: 'MCP Reference Servers', type: 'mcp_server', category: 'mcp-ecosystem', official: true, summary: 'Reference implementations of Model Context Protocol servers maintained by the MCP project.', tags: ['MCP Servers', 'MCP'] },
  { repo: 'modelcontextprotocol/typescript-sdk', name: 'MCP TypeScript SDK', type: 'library', category: 'mcp-ecosystem', official: true, summary: 'Official TypeScript SDK for building Model Context Protocol servers and clients.', tags: ['MCP', 'SDK', 'TypeScript'], language: 'TypeScript' },
  { repo: 'modelcontextprotocol/python-sdk', name: 'MCP Python SDK', type: 'library', category: 'mcp-ecosystem', official: true, summary: 'Official Python SDK for building Model Context Protocol servers and clients.', tags: ['MCP', 'SDK', 'Python'], language: 'Python' },
  { repo: 'microsoft/playwright-mcp', name: 'Playwright MCP', type: 'mcp_server', category: 'mcp-ecosystem', official: true, summary: 'MCP server that gives LLMs browser automation through Playwright accessibility snapshots.', tags: ['MCP Servers', 'Browser Automation'], language: 'TypeScript' },
  { repo: 'github/github-mcp-server', name: 'GitHub MCP Server', type: 'mcp_server', category: 'mcp-ecosystem', official: true, summary: "GitHub's official MCP server for working with repositories, issues and pull requests from AI tools.", tags: ['MCP Servers', 'GitHub'], language: 'Go' },
  { repo: 'langchain-ai/langgraph', name: 'LangGraph', type: 'framework', category: 'ai-agents', summary: 'Framework for building stateful, multi-actor agent applications as graphs.', tags: ['Agent Frameworks', 'Multi-Agent Systems'], language: 'Python', installation: 'pip install langgraph' },
  { repo: 'microsoft/autogen', name: 'AutoGen', type: 'framework', category: 'ai-agents', summary: 'Programming framework for building multi-agent AI applications.', tags: ['Multi-Agent Systems', 'Agent Frameworks'], language: 'Python' },
  { repo: 'crewAIInc/crewAI', name: 'CrewAI', type: 'framework', category: 'ai-agents', summary: 'Framework for orchestrating role-playing, collaborative AI agents.', tags: ['Multi-Agent Systems', 'Agent Frameworks'], language: 'Python', installation: 'pip install crewai' },
  { repo: 'Significant-Gravitas/AutoGPT', name: 'AutoGPT', type: 'ai_agent', category: 'ai-agents', summary: 'Platform for building, deploying and running autonomous AI agents.', tags: ['Autonomous Agents'], language: 'Python' },
  { repo: 'continuedev/continue', name: 'Continue', type: 'tool', category: 'developer-tools', summary: 'Open-source AI code assistant extension for VS Code and JetBrains.', tags: ['IDE Extensions', 'Coding Agents'], language: 'TypeScript' },
  { repo: 'langchain-ai/langchain', name: 'LangChain', type: 'framework', category: 'rag-knowledge-systems', summary: 'Framework for building LLM-powered applications with chains, tools and retrieval.', tags: ['RAG', 'LLM', 'Agent Frameworks'], language: 'Python', installation: 'pip install langchain' },
  { repo: 'run-llama/llama_index', name: 'LlamaIndex', type: 'framework', category: 'rag-knowledge-systems', summary: 'Data framework for connecting LLMs to your own data — ingestion, indexing and retrieval.', tags: ['RAG', 'Document Parsing'], language: 'Python', installation: 'pip install llama-index' },
  { repo: 'chroma-core/chroma', name: 'Chroma', type: 'tool', category: 'rag-knowledge-systems', summary: 'Open-source embedding database for AI applications.', tags: ['Vector Search', 'Embeddings'], installation: 'pip install chromadb' },
  { repo: 'qdrant/qdrant', name: 'Qdrant', type: 'tool', category: 'rag-knowledge-systems', summary: 'Vector similarity search engine and database.', tags: ['Vector Search', 'Embeddings'], language: 'Rust' },
  { repo: 'huggingface/transformers', name: 'Transformers', type: 'library', category: 'ai-machine-learning', summary: 'State-of-the-art pretrained models for text, vision, audio and multimodal tasks.', tags: ['Deep Learning', 'NLP', 'LLM'], language: 'Python', installation: 'pip install transformers' },
  { repo: 'pytorch/pytorch', name: 'PyTorch', type: 'framework', category: 'ai-machine-learning', summary: 'Tensors and dynamic neural networks in Python with strong GPU acceleration.', tags: ['Deep Learning', 'Machine Learning'], language: 'Python', installation: 'pip install torch' },
  { repo: 'facebookresearch/segment-anything', name: 'Segment Anything', type: 'model', category: 'ai-machine-learning', summary: 'Code and model checkpoints for the Segment Anything Model (SAM).', tags: ['Computer Vision', 'Segmentation'], language: 'Python' },
  { repo: 'ollama/ollama', name: 'Ollama', type: 'tool', category: 'generative-ai', summary: 'Run large language models locally.', tags: ['LLM', 'Local Inference'], language: 'Go' },
  { repo: 'ggml-org/llama.cpp', name: 'llama.cpp', type: 'tool', category: 'generative-ai', summary: 'LLM inference in C/C++ with broad hardware support.', tags: ['LLM', 'Edge Inference'], language: 'C++' },
  { repo: 'vllm-project/vllm', name: 'vLLM', type: 'tool', category: 'generative-ai', summary: 'High-throughput, memory-efficient inference and serving engine for LLMs.', tags: ['LLM', 'Inference'], language: 'Python', installation: 'pip install vllm' },
  { repo: 'openai/whisper', name: 'Whisper', type: 'model', category: 'generative-ai', summary: 'Robust speech recognition via large-scale weak supervision.', tags: ['Audio', 'Speech Recognition'], language: 'Python' },
  { repo: 'AUTOMATIC1111/stable-diffusion-webui', name: 'Stable Diffusion web UI', type: 'tool', category: 'generative-ai', summary: 'Browser interface for Stable Diffusion image generation.', tags: ['Image Generation'], language: 'Python' },
  { repo: 'huggingface/datasets', name: 'Hugging Face Datasets', type: 'library', category: 'models-datasets', summary: 'Library for easily accessing and sharing datasets for ML tasks.', tags: ['Dataset', 'Machine Learning'], language: 'Python', installation: 'pip install datasets' },
  { repo: 'pandas-dev/pandas', name: 'pandas', type: 'library', category: 'data-science-analytics', summary: 'Flexible and powerful data analysis and manipulation library for Python.', tags: ['Python', 'Data Engineering'], language: 'Python', installation: 'pip install pandas' },
  { repo: 'jupyter/notebook', name: 'Jupyter Notebook', type: 'tool', category: 'data-science-analytics', summary: 'Web-based notebook environment for interactive computing.', tags: ['Notebooks', 'Python'], language: 'Python', installation: 'pip install notebook' },
  { repo: 'mlflow/mlflow', name: 'MLflow', type: 'tool', category: 'data-science-analytics', summary: 'Open-source platform for the machine learning lifecycle.', tags: ['MLOps', 'Experiment Tracking'], language: 'Python', installation: 'pip install mlflow' },
  { repo: 'vitejs/vite', name: 'Vite', type: 'tool', category: 'web-development', summary: 'Next-generation frontend tooling with a fast dev server.', tags: ['TypeScript', 'Build Tools'], language: 'TypeScript' },
  { repo: 'vercel/next.js', name: 'Next.js', type: 'framework', category: 'web-development', summary: 'The React framework for the web.', tags: ['React', 'Next.js'], language: 'JavaScript' },
  { repo: 'docker/compose', name: 'Docker Compose', type: 'tool', category: 'devops-cloud', summary: 'Define and run multi-container applications with Docker.', tags: ['Docker', 'Containers'], language: 'Go' },
  { repo: 'kubernetes/kubernetes', name: 'Kubernetes', type: 'tool', category: 'devops-cloud', summary: 'Production-grade container scheduling and management.', tags: ['Kubernetes', 'Containers'], language: 'Go' },
  { repo: 'NationalSecurityAgency/ghidra', name: 'Ghidra', type: 'tool', category: 'security-reverse-engineering', summary: 'Software reverse engineering framework for defensive analysis and authorized research.', tags: ['Binary Analysis', 'Reverse Engineering'], language: 'Java' },
  { repo: 'radareorg/radare2', name: 'radare2', type: 'tool', category: 'security-reverse-engineering', summary: 'UNIX-like reverse engineering framework and command-line toolset.', tags: ['Binary Analysis', 'Debugging'], language: 'C' },
  { repo: 'ros2/ros2', name: 'ROS 2', type: 'framework', category: 'robotics-edge-ai', summary: 'Robot Operating System 2 — libraries and tools for building robot applications.', tags: ['Robotics'] },
  // Cloud Infrastructure & IaC
  { repo: 'hashicorp/terraform', name: 'Terraform', type: 'tool', category: 'cloud-infrastructure', summary: 'Infrastructure as code tool to provision and manage cloud and on-prem resources declaratively.', tags: ['Infrastructure as Code', 'Cloud'], language: 'Go' },
  { repo: 'opentofu/opentofu', name: 'OpenTofu', type: 'tool', category: 'cloud-infrastructure', summary: 'Open-source infrastructure as code tool, a community fork of Terraform.', tags: ['Infrastructure as Code', 'Cloud'], language: 'Go' },
  { repo: 'pulumi/pulumi', name: 'Pulumi', type: 'tool', category: 'cloud-infrastructure', summary: 'Infrastructure as code using general-purpose languages such as TypeScript, Python and Go.', tags: ['Infrastructure as Code', 'Cloud'], language: 'Go' },
  { repo: 'crossplane/crossplane', name: 'Crossplane', type: 'framework', category: 'cloud-infrastructure', summary: 'Kubernetes-based control plane framework for managing cloud infrastructure.', tags: ['Kubernetes', 'Cloud'], language: 'Go' },
  { repo: 'localstack/localstack', name: 'LocalStack', type: 'tool', category: 'cloud-infrastructure', summary: 'Local emulator of AWS cloud services for development and testing.', tags: ['AWS', 'Cloud', 'Testing'], language: 'Python' },
  { repo: 'aws/aws-cli', name: 'AWS CLI', type: 'tool', category: 'cloud-infrastructure', official: true, summary: 'Official command-line interface for Amazon Web Services.', tags: ['AWS', 'CLI', 'Cloud'], language: 'Python' },
  { repo: 'Azure/azure-cli', name: 'Azure CLI', type: 'tool', category: 'cloud-infrastructure', official: true, summary: 'Official command-line interface for Microsoft Azure.', tags: ['Azure', 'CLI', 'Cloud'], language: 'Python' },
  // IT Operations & Monitoring
  { repo: 'prometheus/prometheus', name: 'Prometheus', type: 'tool', category: 'it-operations', summary: 'Monitoring system and time-series database with alerting.', tags: ['Monitoring', 'Observability'], language: 'Go' },
  { repo: 'grafana/grafana', name: 'Grafana', type: 'tool', category: 'it-operations', summary: 'Dashboards and visualization for metrics, logs and traces.', tags: ['Monitoring', 'Dashboards', 'Observability'] },
  { repo: 'open-telemetry/opentelemetry-collector', name: 'OpenTelemetry Collector', type: 'tool', category: 'it-operations', summary: 'Vendor-agnostic service to receive, process and export telemetry data.', tags: ['Observability', 'Tracing'], language: 'Go' },
  { repo: 'netdata/netdata', name: 'Netdata', type: 'tool', category: 'it-operations', summary: 'Real-time infrastructure monitoring for servers, containers and applications.', tags: ['Monitoring'] },
  { repo: 'louislam/uptime-kuma', name: 'Uptime Kuma', type: 'tool', category: 'it-operations', summary: 'Self-hosted uptime monitoring tool with status pages and notifications.', tags: ['Monitoring', 'Self-hosted'] },
  { repo: 'ansible/ansible', name: 'Ansible', type: 'tool', category: 'it-operations', summary: 'Agentless IT automation for configuration management, deployment and orchestration.', tags: ['Configuration Management', 'Automation'], language: 'Python' },
  // IT Service & Asset Management
  { repo: 'glpi-project/glpi', name: 'GLPI', type: 'tool', category: 'it-service-management', summary: 'IT service management software with asset inventory and helpdesk ticketing.', tags: ['ITSM', 'Helpdesk', 'Asset Management'], language: 'PHP' },
  { repo: 'snipe/snipe-it', name: 'Snipe-IT', type: 'tool', category: 'it-service-management', summary: 'Self-hosted IT asset and license management system.', tags: ['Asset Management', 'Self-hosted'], language: 'PHP' },
  { repo: 'zammad/zammad', name: 'Zammad', type: 'tool', category: 'it-service-management', summary: 'Web-based helpdesk and customer support ticketing system.', tags: ['Helpdesk', 'Ticketing'], language: 'Ruby' },
  { repo: 'osTicket/osTicket', name: 'osTicket', type: 'tool', category: 'it-service-management', summary: 'Support ticket system that routes inquiries from email, web forms and phone.', tags: ['Helpdesk', 'Ticketing'], language: 'PHP' },
  // Networking & Proxies
  { repo: 'nginx/nginx', name: 'NGINX', type: 'tool', category: 'networking', official: true, summary: 'Web server, reverse proxy and load balancer.', tags: ['Web Server', 'Reverse Proxy'], language: 'C' },
  { repo: 'caddyserver/caddy', name: 'Caddy', type: 'tool', category: 'networking', summary: 'Web server with automatic HTTPS.', tags: ['Web Server', 'Reverse Proxy', 'TLS'], language: 'Go' },
  { repo: 'traefik/traefik', name: 'Traefik', type: 'tool', category: 'networking', summary: 'Cloud-native HTTP reverse proxy and load balancer with automatic service discovery.', tags: ['Reverse Proxy', 'Kubernetes'], language: 'Go' },
  { repo: 'tailscale/tailscale', name: 'Tailscale', type: 'tool', category: 'networking', summary: 'WireGuard-based mesh VPN client and daemon.', tags: ['VPN', 'WireGuard'], language: 'Go' },
  { repo: 'pi-hole/pi-hole', name: 'Pi-hole', type: 'tool', category: 'networking', summary: 'Network-wide DNS sinkhole for blocking ads and trackers.', tags: ['DNS', 'Self-hosted'] },
  // Databases & Storage
  { repo: 'postgres/postgres', name: 'PostgreSQL', type: 'tool', category: 'databases-storage', official: true, summary: 'Open-source object-relational database system (official mirror).', tags: ['SQL', 'Database'], language: 'C' },
  { repo: 'redis/redis', name: 'Redis', type: 'tool', category: 'databases-storage', official: true, summary: 'In-memory data store used as a database, cache and message broker.', tags: ['In-memory', 'Cache', 'Database'], language: 'C' },
  { repo: 'duckdb/duckdb', name: 'DuckDB', type: 'tool', category: 'databases-storage', summary: 'In-process analytical SQL database.', tags: ['SQL', 'Analytics', 'Database'], language: 'C++' },
  { repo: 'cockroachdb/cockroach', name: 'CockroachDB', type: 'tool', category: 'databases-storage', summary: 'Distributed SQL database built for resilience and horizontal scale.', tags: ['SQL', 'Distributed Systems', 'Database'], language: 'Go' },
  { repo: 'supabase/supabase', name: 'Supabase', type: 'tool', category: 'databases-storage', summary: 'Postgres development platform with auth, storage, realtime and APIs.', tags: ['Postgres', 'Backend as a Service'] },
  { repo: 'minio/minio', name: 'MinIO', type: 'tool', category: 'databases-storage', summary: 'S3-compatible object storage server.', tags: ['Object Storage', 'S3'], language: 'Go' },
  // Cybersecurity & Compliance (defensive)
  { repo: 'aquasecurity/trivy', name: 'Trivy', type: 'tool', category: 'cybersecurity-defense', summary: 'Scanner for vulnerabilities, misconfigurations, secrets and SBOMs in containers, code and clusters.', tags: ['Vulnerability Scanning', 'Containers'], language: 'Go' },
  { repo: 'gitleaks/gitleaks', name: 'Gitleaks', type: 'tool', category: 'cybersecurity-defense', summary: 'Detects hardcoded secrets such as passwords and API keys in git repositories.', tags: ['Secret Detection', 'DevSecOps'], language: 'Go' },
  { repo: 'wazuh/wazuh', name: 'Wazuh', type: 'tool', category: 'cybersecurity-defense', summary: 'Open-source security platform for threat detection, integrity monitoring and compliance.', tags: ['SIEM', 'Compliance'] },
  { repo: 'falcosecurity/falco', name: 'Falco', type: 'tool', category: 'cybersecurity-defense', summary: 'Cloud-native runtime security tool that detects abnormal behavior in hosts and containers.', tags: ['Runtime Security', 'Kubernetes'], language: 'C++' },
  { repo: 'zaproxy/zaproxy', name: 'ZAP', type: 'tool', category: 'cybersecurity-defense', summary: 'Web application security scanner for testing your own applications.', tags: ['Application Security', 'DAST'], language: 'Java' },
  { repo: 'CISOfy/lynis', name: 'Lynis', type: 'tool', category: 'cybersecurity-defense', summary: 'Security auditing and hardening tool for Linux, macOS and Unix systems.', tags: ['Hardening', 'Compliance'] },
  // Automation & Integration
  { repo: 'n8n-io/n8n', name: 'n8n', type: 'workflow', category: 'automation-integration', summary: 'Workflow automation platform with a visual editor and many integrations.', tags: ['Workflow Automation', 'Integrations'], language: 'TypeScript' },
  { repo: 'node-red/node-red', name: 'Node-RED', type: 'tool', category: 'automation-integration', summary: 'Low-code, flow-based programming tool for wiring together devices, APIs and services.', tags: ['Low-code', 'IoT', 'Integrations'], language: 'JavaScript' },
  { repo: 'activepieces/activepieces', name: 'Activepieces', type: 'workflow', category: 'automation-integration', summary: 'Open-source business automation tool, an alternative to Zapier.', tags: ['Workflow Automation', 'Integrations'], language: 'TypeScript' },
  { repo: 'apache/airflow', name: 'Apache Airflow', type: 'tool', category: 'automation-integration', summary: 'Platform to author, schedule and monitor workflows as code.', tags: ['Orchestration', 'Data Engineering'], language: 'Python' },
  { repo: 'temporalio/temporal', name: 'Temporal', type: 'framework', category: 'automation-integration', summary: 'Durable execution platform for running reliable, long-running workflows.', tags: ['Orchestration', 'Distributed Systems'], language: 'Go' },
  { repo: 'karpathy/nanoGPT', name: 'nanoGPT', type: 'paper_implementation', category: 'research-papers', summary: 'Simple, fast repository for training and fine-tuning medium-sized GPTs.', tags: ['Paper Implementations', 'LLM'], language: 'Python' },
];
