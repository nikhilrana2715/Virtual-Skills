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
  { repo: 'karpathy/nanoGPT', name: 'nanoGPT', type: 'paper_implementation', category: 'research-papers', summary: 'Simple, fast repository for training and fine-tuning medium-sized GPTs.', tags: ['Paper Implementations', 'LLM'], language: 'Python' },
];
