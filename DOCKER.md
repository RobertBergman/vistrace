# VisTrace Docker Setup

Complete Docker Compose setup with PostgreSQL database, backend API, and frontend React app.

## 🐳 Services

### Core Services
- **postgres**: PostgreSQL 15 database with initialization scripts
- **backend**: Node.js API with real traceroute execution
- **frontend**: React app served by Nginx with proper routing
- **pgadmin**: Database management UI (optional)

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 2GB RAM available for containers

### 1. Build and Start All Services
```bash
# Build and start all containers
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 2. Access the Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **pgAdmin**: http://localhost:5050

### 3. Database Access
**pgAdmin Login:**
- Email: `admin@vistrace.com`
- Password: `admin123`

**Database Connection (in pgAdmin):**
- Host: `postgres`
- Port: `5432`
- Database: `vistrace`
- Username: `vistrace_user`
- Password: `vistrace_password`

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://vistrace_user:vistrace_password@postgres:5432/vistrace

# Optional API Keys
IPSTACK_API_KEY=your_ipstack_key
IPINFO_TOKEN=your_ipinfo_token
```

**Frontend:**
```bash
REACT_APP_BACKEND_URL=http://localhost:3001
```

### Network Requirements
The backend container requires special network capabilities for traceroute:
- `NET_RAW` - Raw socket access
- `NET_ADMIN` - Network administration

## 📊 Database Schema

### Tables
- **traces**: Main traceroute execution records
- **hops**: Individual network hop data
- **packets**: Detailed packet information

### Views
- **trace_summary**: Aggregated trace statistics
- **latest_traces**: Most recent 100 traces

### Sample Queries
```sql
-- View recent traces
SELECT * FROM latest_traces;

-- Get trace details with hops
SELECT t.destination, h.hop_number, h.ip_address, h.average_time
FROM traces t
JOIN hops h ON t.id = h.trace_id
WHERE t.destination = 'google.com'
ORDER BY h.hop_number;
```

## 🛠️ Development

### Individual Service Commands
```bash
# Start only database
docker-compose up postgres

# Start backend (requires postgres)
docker-compose up postgres backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in containers
docker-compose exec backend sh
docker-compose exec postgres psql -U vistrace_user -d vistrace
```

### Rebuild Services
```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Force rebuild without cache
docker-compose build --no-cache
```

## 🔒 Security Features

### Container Security
- Non-root users in all containers
- Read-only filesystems where possible
- Minimal attack surface with Alpine Linux
- Health checks for all services

### Network Security
- Isolated Docker network
- No unnecessary port exposure
- Secure database credentials
- CORS protection

### Application Security
- Input validation and sanitization
- SQL injection protection
- XSS protection headers
- Rate limiting (TODO)

## 📈 Monitoring

### Health Checks
All services include health checks:
```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect vistrace-backend --format='{{.State.Health}}'
```

### Logs
```bash
# Follow all logs
docker-compose logs -f

# Service-specific logs
docker-compose logs -f postgres
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🚨 Troubleshooting

### Common Issues

**1. Permission Denied for Traceroute**
```bash
# Ensure containers have network capabilities
docker-compose down
docker-compose up --build
```

**2. Database Connection Failed**
```bash
# Check PostgreSQL is ready
docker-compose logs postgres

# Wait for health check to pass
docker-compose ps
```

**3. Frontend Can't Connect to Backend**
```bash
# Check backend is running
curl http://localhost:3001/health

# Verify Nginx proxy configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

**4. Build Failures**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Debug Commands
```bash
# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Check container processes
docker-compose exec backend ps aux

# View container resources
docker stats
```

## 🔄 Updates and Maintenance

### Updating Images
```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest dependencies
docker-compose build --pull
```

### Database Backups
```bash
# Create backup
docker-compose exec postgres pg_dump -U vistrace_user vistrace > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U vistrace_user vistrace < backup.sql
```

### Log Rotation
```bash
# Configure in docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 📋 Production Deployment

### Environment Setup
1. Set production environment variables
2. Configure SSL/TLS certificates
3. Set up reverse proxy (Nginx/Traefik)
4. Configure monitoring and alerting
5. Set up automated backups

### Security Hardening
1. Use secrets management
2. Enable container scanning
3. Implement log aggregation
4. Set resource limits
5. Enable audit logging

### Performance Optimization
1. Tune PostgreSQL settings
2. Configure Nginx caching
3. Optimize Docker images
4. Set memory/CPU limits
5. Use multi-stage builds

## 📞 Support

For issues and questions:
1. Check service logs: `docker-compose logs`
2. Verify health checks: `docker-compose ps`
3. Test network connectivity between containers
4. Review Docker and system requirements
