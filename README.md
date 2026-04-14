# Daycoval Priorização de Leads - Frontend

Interface web **React + TypeScript** para consultas em linguagem natural sobre leads priorizados por Machine Learning. Chat conversacional intuitivo integrado com backend IA (Azure OpenAI GPT-4o).

## 📋 Visão Geral

Frontend moderno com:

- **Chat conversacional**: Interface limpa tipo ChatGPT
- **Markdown rendering**: Respostas formatadas (tabelas, listas, código)
- **Multi-sessões**: Histórico de conversas isoladas
- **Autenticação JWT**: Login seguro
- **Responsivo**: Desktop, tablet, mobile

**Stack:**
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **TailwindCSS** (styling)
- **Axios** (HTTP client)
- **Lucide React** (icons)
- **React Markdown** (formatação)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e npm/yarn
- Backend API rodando (default: `http://localhost:8000`)

### Instalação Local

```bash
# Clonar repositório
git clone https://github.com/timetech-internal/daycoval-priorizacao-leads-fontend.git
cd daycoval-priorizacao-leads-fontend

# Instalar dependências
npm install
# ou
yarn install
```

### Configuração

Criar `.env` na raiz:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=Daycoval Leads Assistant
VITE_VERSION=1.0.0
```

**Produção:**
```env
VITE_API_URL=https://api-daycoval.azurewebsites.net
VITE_APP_TITLE=Daycoval Leads Assistant
VITE_VERSION=1.0.0
```

### Execução Local

```bash
# Desenvolvimento (hot reload)
npm run dev
# ou
yarn dev
```

**Aplicação disponível em:** `http://localhost:5173`

### Build para Produção

```bash
# Build otimizado
npm run build
# ou
yarn build

# Preview do build
npm run preview
# ou
yarn preview
```

## 📁 Estrutura do Código

```
daycoval-priorizacao-leads-fontend/
├── index.html               # HTML root
├── package.json             # Dependências e scripts
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── tailwind.config.js       # TailwindCSS config
├── postcss.config.js        # PostCSS config
├── Dockerfile               # Build container (nginx)
├── nginx.conf               # Nginx config (produção)
│
├── src/
│   ├── main.tsx             # Entrypoint React
│   ├── App.tsx              # Componente principal
│   ├── index.css            # Estilos globais (Tailwind)
│   ├── types.ts             # TypeScript types
│   │
│   ├── api/
│   │   └── client.ts        # Cliente HTTP (Axios + interceptors)
│   │
│   ├── components/
│   │   ├── ChatInterface.tsx    # Interface de chat principal
│   │   ├── MessageList.tsx      # Lista de mensagens
│   │   ├── MessageInput.tsx     # Input de mensagem
│   │   ├── SessionList.tsx      # Lista de sessões
│   │   ├── LoginForm.tsx        # Formulário de login
│   │   └── Header.tsx           # Header da aplicação
│   │
│   └── __tests__/
│       ├── App.test.tsx
│       ├── client.test.ts
│       └── ...
│
├── k8s/                     # Kubernetes Manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── namespace.yaml
│   └── networkpolicy.yaml
│
└── public/
    └── favicon.ico
```

## 🎨 Componentes Principais

### `App.tsx`

Componente raiz com roteamento e gerenciamento de autenticação.

```tsx
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <ChatInterface sessionId={currentSession} />
      )}
    </div>
  );
}
```

### `ChatInterface.tsx`

Interface principal de chat com histórico de mensagens e input.

**Features:**
- Renderização de markdown
- Auto-scroll para última mensagem
- Loading states
- Error handling
- Timestamps

### `MessageList.tsx`

Exibe lista de mensagens formatadas:

```tsx
<div className="message user">
  <div className="avatar">U</div>
  <div className="content">
    Quais são os top 10 leads do cluster Alta?
  </div>
</div>

<div className="message assistant">
  <div className="avatar">AI</div>
  <div className="content markdown">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {response}
    </ReactMarkdown>
  </div>
</div>
```

### `SessionList.tsx`

Sidebar com lista de sessões de chat:

```tsx
<aside className="session-sidebar">
  <button onClick={createNewSession}>+ Nova Conversa</button>
  <ul>
    {sessions.map(session => (
      <li key={session.id} onClick={() => selectSession(session.id)}>
        {session.title}
      </li>
    ))}
  </ul>
</aside>
```

## 🔌 Integração com API

### Cliente HTTP (`api/client.ts`)

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

### Endpoints Utilizados

```typescript
// Login
POST /auth/login
{ username, password } → { access_token }

// Criar sessão
POST /sessions
{ title } → { session_id, ... }

// Listar sessões
GET /sessions → [{ session_id, title, ... }]

// Obter sessão
GET /sessions/{id} → { session_id, messages, ... }

// Enviar mensagem
POST /sessions/{id}/chat
{ message } → { response, sources, ... }

// Deletar sessão
DELETE /sessions/{id} → 204
```

## 🎨 Estilização

### TailwindCSS

Classes utilitárias para styling rápido:

```tsx
<div className="flex flex-col h-screen bg-gray-50">
  <header className="bg-white shadow-sm px-6 py-4">
    <h1 className="text-2xl font-bold text-gray-900">
      Daycoval Leads Assistant
    </h1>
  </header>

  <main className="flex-1 overflow-y-auto p-6">
    {/* Messages */}
  </main>

  <footer className="bg-white border-t px-6 py-4">
    {/* Input */}
  </footer>
</div>
```

### Custom CSS

Estilos adicionais em `index.css`:

```css
.message {
  @apply flex gap-3 p-4 rounded-lg;
}

.message.user {
  @apply bg-blue-50 ml-auto max-w-2xl;
}

.message.assistant {
  @apply bg-white border mr-auto max-w-3xl;
}

.markdown table {
  @apply w-full border-collapse mb-4;
}

.markdown th {
  @apply bg-gray-100 font-semibold p-2 border;
}

.markdown td {
  @apply p-2 border;
}
```

## 🐳 Deploy com Docker

### Build

```bash
docker build -t daycoval-frontend:latest .
```

**Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Run Local

```bash
docker run -p 3000:80 daycoval-frontend:latest
```

### Push para ACR

```bash
# Login
az acr login --name acrdaycodev

# Tag
docker tag daycoval-frontend:latest acrdaycodev.azurecr.io/daycoval-frontend:v1.0.0

# Push
docker push acrdaycodev.azurecr.io/daycoval-frontend:v1.0.0
```

## ☸️ Deploy no Kubernetes (AKS)

```bash
# Aplicar configurações
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/networkpolicy.yaml

# Verificar status
kubectl get pods -n daycoval -l app=frontend
kubectl logs -n daycoval -l app=frontend --tail=100
```

**Manifesto de Deployment (resumo):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: daycoval
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: frontend
        image: acrdaycodev.azurecr.io/daycoval-frontend:v1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

**Service (LoadBalancer):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: daycoval
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: frontend
```

## 🧪 Testes

```bash
# Executar testes
npm run test
# ou
yarn test

# Testes em modo watch
npm run test -- --watch

# Cobertura
npm run test -- --coverage
```

**Frameworks:**
- **Vitest**: Test runner
- **Testing Library**: Component testing
- **jsdom**: DOM simulation

**Exemplo de teste:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders login form', () => {
  render(<App />);
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});

test('sends message on submit', async () => {
  render(<ChatInterface sessionId="123" />);
  
  const input = screen.getByPlaceholderText(/digite sua mensagem/i);
  await userEvent.type(input, 'Olá!');
  await userEvent.click(screen.getByRole('button', { name: /enviar/i }));
  
  expect(screen.getByText(/olá!/i)).toBeInTheDocument();
});
```

## 📊 Monitoramento

### Nginx Access Logs

```bash
kubectl logs -n daycoval -l app=frontend | grep "GET /api"
```

### Performance

- **Lighthouse**: Score 90+ (Performance, Accessibility)
- **Bundle size**: < 500 KB (gzipped)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s

### Application Insights

Se configurado, métricas automáticas de:
- Page views
- User sessions
- Exceptions de JavaScript
- Ajax calls

## 🔒 Segurança

- **HTTPS**: TLS 1.2+ em produção
- **CSP**: Content Security Policy headers
- **XSS**: Sanitização de inputs
- **CORS**: Configurado no backend
- **JWT**: Tokens armazenados em localStorage (considerar httpOnly cookies)

**Nginx Security Headers:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

## 🚨 Troubleshooting

### Erro de CORS

Verificar configuração do backend:
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend-daycoval.azurewebsites.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Build falha

```bash
# Limpar cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### Token expirado

```typescript
// Verificar validade do token
const token = localStorage.getItem('access_token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.exp * 1000 < Date.now()) {
    // Token expirado, fazer logout
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
}
```

## 📚 Dependências

| Pacote | Versão | Uso |
|--------|--------|-----|
| `react` | 18.3.1 | UI framework |
| `react-dom` | 18.3.1 | DOM rendering |
| `typescript` | 5.6.3 | Type safety |
| `vite` | 6.0.7 | Build tool |
| `axios` | 1.7.0 | HTTP client |
| `react-markdown` | 10.1.0 | Markdown rendering |
| `lucide-react` | 0.460.0 | Icons |
| `tailwindcss` | 3.4.17 | Styling |

## 📧 Contato

Time Tech Internal - Daycoval ML Team

---

**Versão**: 1.0.0  
**Última atualização**: Abril 2026
