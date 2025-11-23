# Systems Administrator Guide: Phase 3 Terminal Interface
**Status:** Ready for Deployment Planning
**Date:** 2025-11-22
**Audience:** System Administrators, DevOps, Infrastructure Team
**Purpose:** Keep site synchronized with backend BBS blockchain interface evolution

---

## 🎯 Overview: Your Role in Phase 3

As a system administrator, you will:

1. **Maintain API Availability** - Ensure backend services are responsive and reliable
2. **Keep Documentation Synchronized** - Update this guide as backend team evolves the protocol
3. **Monitor Data Flows** - Track blockchain queries, LLM calls, and user interactions
4. **Manage Continuous Updates** - Deploy new unlocks and features without downtime
5. **Support Progressive Rollouts** - Test changes on staging before production
6. **Troubleshoot Integration Issues** - Bridge frontend/backend when things break
7. **Update Frontend with New Features** - Coordinate with frontend team on new ceremonies, displays, etc.

---

## 📊 Phase 3 Systems Architecture

### Service Dependencies Map

```
┌─────────────────────────────────────────────────────┐
│                  PUBLIC WEBSITE                     │
│            (Terminal Interface Frontend)            │
│  https://convergence-protocol.io                    │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
   ┌────▼─────┐      ┌────▼─────┐
   │  Wallet  │      │  API      │
   │  Connect │      │  Service  │
   └──────────┘      └────┬──────┘
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
   ┌────▼─────┐      ┌────▼──────┐     ┌────▼────┐
   │Blockchain│      │    LLM    │     │Database │
   │  RPC     │      │  (Claude) │     │ (Logs)  │
   │Nodes     │      │  Service  │     │         │
   └──────────┘      └───────────┘     └─────────┘
        │
   ┌────▼──────────────────────────────────┐
   │  Smart Contracts on Ethereum          │
   │  - Covenant NFT                       │
   │  - TRUST/TALLY/VOUCHER tokens        │
   │  - Governance                        │
   │  - Reserves                          │
   └───────────────────────────────────────┘
```

### Service Status Dashboard (You Must Monitor)

```
Service                Status  Latency  Error Rate  Action
─────────────────────────────────────────────────────────────
Ethereum RPC          ✓ OK    45ms     0.01%      Normal
Backup RPC (Alchemy)  ✓ OK    52ms     0.02%      Standby
API Service           ✓ OK    380ms    0.05%      Normal
LLM Service (Claude)  ✓ OK    1200ms   0.10%      Normal
Database              ✓ OK    120ms    0.00%      Normal
Frontend              ✓ OK    150ms    0.02%      Normal
─────────────────────────────────────────────────────────────
Overall Health:       ✓ OK    Average  OK         Normal
```

---

## 🔧 Setup & Deployment

### Prerequisites for Phase 3

You must have in place:

1. **Blockchain Node Access**
   - Primary Ethereum RPC endpoint (Infura/Alchemy/custom node)
   - Backup RPC endpoint
   - Block explorer API (Etherscan)

2. **API Server Infrastructure**
   - Node.js runtime (v18+)
   - PostgreSQL database
   - Redis cache (optional but recommended)
   - Load balancer (if multi-server)

3. **LLM Integration**
   - Anthropic API key (Claude)
   - Cost tracking & billing setup
   - Rate limiting configured

4. **Monitoring Stack**
   - Uptime monitoring (Datadog/New Relic/Prometheus)
   - Error tracking (Sentry)
   - Log aggregation (ELK/Datadog)
   - Alerting system

5. **Frontend Hosting**
   - Static file hosting (S3/CDN)
   - HTTPS certificate
   - Domain DNS records
   - SSL/TLS configured

### Deployment Checklist

#### Week Before Launch
- [ ] Load test API with 1000+ concurrent users
- [ ] Test failover to backup RPC node
- [ ] Test LLM service degradation
- [ ] Backup database
- [ ] Review smart contract ABIs with backend team
- [ ] Pre-cache unlock configurations
- [ ] Review security audit findings

#### Day Before Launch
- [ ] Deploy to staging
- [ ] Run end-to-end tests
- [ ] Verify all APIs respond correctly
- [ ] Check LLM interpretation quality
- [ ] Confirm unlocks calculate correctly
- [ ] Monitor staging traffic for 2 hours

#### Launch Day
- [ ] Deploy to production
- [ ] Monitor error rates for 1 hour
- [ ] Watch user feedback in real-time
- [ ] Keep incident response team on standby
- [ ] Document any issues
- [ ] Celebrate! 🎉

---

## 📈 Monitoring & Alerting Configuration

### Critical Metrics to Watch

#### API Response Time (SLA: <2 seconds, p95)
```
Alert if:
  - p95 > 2 seconds
  - p99 > 3 seconds
  - p50 > 1 second
```

**Troubleshooting:**
- If increased: Check database query performance
- If spiking: Could be LLM service slow
- If RPC slow: Failover to backup node

#### LLM Service Cost & Rate
```
Monthly budget: $500
Daily budget: ~$16.67

Alert if:
  - Daily spend > $25
  - Rate > 150 requests/min sustained
```

**Troubleshooting:**
- Check for clients hitting endpoint repeatedly
- Verify LLM caching is working
- Review max_tokens in prompts

#### RPC Node Health
```
Alert if:
  - Any call errors > 0.1%
  - Any timeout > 5s
  - Block sync lag > 1 block behind latest
```

**Troubleshooting:**
- Node might be out of sync
- Network connectivity issue
- Failover to backup provider

#### Database Performance
```
Alert if:
  - Query time > 500ms (p95)
  - Connection pool > 80% utilized
  - Disk space > 80% full
```

**Troubleshooting:**
- Missing indexes
- Table bloat
- Need query optimization

#### Error Rate (Target: < 0.1%)
```
Alert if:
  - Error rate > 0.5%
  - 5xx errors appear
  - Specific endpoints failing
```

**Troubleshooting:**
- Check logs for patterns
- Look for smart contract reverts
- Verify data integrity

### Automated Alerts to Set Up

```yaml
alerts:
  - name: api_response_time_high
    condition: p95_latency > 2000ms
    severity: warning
    action: page_on_call_engineer

  - name: llm_service_down
    condition: service_status == down
    severity: critical
    action: page_on_call_engineer + slack

  - name: rpc_errors_high
    condition: error_rate > 1%
    severity: critical
    action: failover_to_backup_node

  - name: database_disk_full
    condition: disk_usage > 85%
    severity: critical
    action: page_dba

  - name: unlock_eligibility_mismatch
    condition: user_disputes_unlock_status
    severity: warning
    action: create_incident + notify_backend
```

---

## 🔄 Continuous Update Process (Weekly)

### Monday: Planning Meeting
- [ ] Backend team reports new unlocks/features
- [ ] Review unlock definitions (BACKEND_REQUIREMENTS_PHASE_3.md)
- [ ] Plan frontend UI changes needed
- [ ] Discuss deployment strategy

### Tuesday-Wednesday: Development
- [ ] Frontend team builds new components
- [ ] Backend team deploys new APIs
- [ ] QA testing in staging environment
- [ ] Documentation updates

### Thursday: Staging Testing
- [ ] Deploy all changes to staging
- [ ] Run full unlock ceremony tests
- [ ] Test blockchain data queries
- [ ] Verify LLM interpretations
- [ ] Load test with 500+ simulated users

### Friday: Production Deployment
- [ ] Blue-green deployment (zero downtime)
- [ ] Monitor error rates for 2 hours
- [ ] Gather user feedback
- [ ] Document any issues
- [ ] Update this guide with learnings

---

## 🆕 Adding New Unlocks (Backend Team Initiative)

When backend team creates a new unlock, you coordinate deployment:

### Step 1: Receive Unlock Definition
Backend team sends PR with new unlock in `/api/unlocks/create`

```json
{
  "id": "new-unlock-id",
  "title": "New Achievement",
  "requirements": { ... },
  "ceremony": { ... }
}
```

### Step 2: Frontend Prepares Display
Frontend team adds component to display unlock content:

```javascript
// Example: frontend/components/UnlockDisplays.js
export const displays = {
  "new-unlock-id": <NewUnlockComponent />
}
```

### Step 3: Staging Test
- Deploy backend changes to staging API
- Deploy frontend changes to staging frontend
- Test unlock eligibility
- Verify ceremony animation
- Check LLM interpretation quality

### Step 4: Production Deployment
- Deploy API changes (blue-green)
- Deploy frontend changes (CDN with cache busting)
- Verify both in sync
- Monitor first 100 users unlocking

### Step 5: Monitor & Support
- Watch for user issues
- Check error rates
- Gather feedback on naming/descriptions
- Update docs with new unlock

---

## 🔐 Security & Updates

### Smart Contract Updates
When backend team deploys new smart contracts:

1. Receive new contract addresses
2. Update frontend configuration
3. Test with testnet first
4. Verify ABI changes
5. Deploy to production
6. Monitor contract interactions

### API Endpoint Changes
When backend team changes APIs:

1. Update BACKEND_REQUIREMENTS_PHASE_3.md
2. Update frontend request code
3. Test in staging
4. Implement backward compatibility if needed
5. Coordinate deployment timing
6. Document changes

### LLM Prompt Updates
When backend team refines LLM prompts:

1. Review prompt changes
2. Test interpretation quality
3. Check for bias/issues
4. Gather user feedback on narrative
5. Iterate if needed
6. Log final prompt for audit

---

## 🚨 Incident Response Playbooks

### Incident: API Service Down

**Impact:** Users can't unlock content, can't see blockchain data

**Response:**
```
1. Alert: Check API service status
2. Logs: Look for errors in API server logs
3. Database: Verify database connection
4. RPC: Check blockchain node connectivity
5. Fix: Restart API service or failover
6. Test: Make request to /health endpoint
7. Monitor: Watch error rate for 30 minutes
8. Comms: Notify team in Slack
9. Postmortem: Review cause next day
```

### Incident: LLM Service Slow/Down

**Impact:** Users see loading spinner, unlocks delayed

**Response:**
```
1. Alert: Check LLM service status
2. Check: Anthropic status page
3. Fallback: Return cached interpretations
4. Notify: Tell frontend team to show loading state
5. Monitor: Track when service recovers
6. Comms: Update status page if external
7. Optimize: Consider prompt optimization
8. Test: Verify service recovering with test call
```

### Incident: Smart Contract Revert

**Impact:** Blockchain queries fail, users can't verify unlock eligibility

**Response:**
```
1. Logs: Check API error logs for revert reason
2. Blockchain: Query contract directly on block explorer
3. Notify: Alert backend team immediately
4. Fallback: Return cached eligibility data
5. Frontend: Show "Unable to verify status, please retry"
6. Fix: Backend team investigates contract issue
7. Test: Verify contract working on testnet
8. Deploy: Re-deploy or fix contract as needed
```

### Incident: Database Query Slow

**Impact:** API responses slow, users frustrated

**Response:**
```
1. Metrics: Check database query performance
2. Queries: Identify slowest queries from logs
3. Indexes: Check if missing indexes
4. Cache: Increase Redis cache TTL
5. Optimize: Run query analysis/explain plan
6. Test: Verify query performance improved
7. Monitor: Watch database metrics
8. Backlog: Add optimization task for next sprint
```

---

## 📝 Documentation You Must Keep Updated

### This Guide (Weekly)
- Update service status section
- Document any architecture changes
- Note new tools/services added
- Record lessons learned

### PHASE_3_TERMINAL_INTERFACE.md (Monthly)
- Update implementation timeline
- Note completed features
- Document changes to unlock system
- Record performance metrics

### BACKEND_REQUIREMENTS_PHASE_3.md (As Changes Come)
- Update API endpoint responses
- Document new smart contract methods
- Note LLM prompt changes
- Record new unlock definitions

### DEPLOYMENT_STATUS.md (Ongoing)
- Keep agent infrastructure status current
- Record server updates
- Note security patches
- Document protocol changes

---

## 📊 Metrics to Track & Report

### Weekly Metrics Report

```
Week of: 2025-11-22

PERFORMANCE
  API Response Time (p95): 450ms ↓ (was 520ms)
  LLM Service Latency: 1100ms ↓ (was 1250ms)
  Database Query Time: 85ms → (stable)
  Frontend Load Time: 2.3s ↓ (was 2.8s)
  Uptime: 99.98% (2 minute outage Wednesday)

USAGE
  Daily Active Users: 3,240 ↑ (was 2,890)
  Unlocks Completed: 1,847 ↑ (was 1,620)
  Avg Ceremony Duration: 8.2s → (stable)
  LLM Calls: 2,156 (estimate cost: $8.62)

QUALITY
  Error Rate: 0.08% ↓ (was 0.12%)
  Smart Contract Reverts: 0
  Failed RPC Calls: 2 (0.04%)
  User Complaints: 0

UPCOMING
  New unlock "Protocol Elder" deploying Friday
  Backend team optimizing LLM prompts
  Database migration planned next week
  Planned 2-hour maintenance window Sunday 2-4am UTC
```

---

## 🔗 Integration Points with Backend Team

### Weekly Sync Agenda
- **Monday 10am:** Sync with backend team lead on week's changes
- **Wednesday 2pm:** QA testing of staging features
- **Thursday 4pm:** Readiness review before Friday production push
- **Friday 3pm:** Retrospective on any incidents

### Communication Channels
- **Slack:** #phase-3-backend for real-time issues
- **Email:** Weekly metrics reports sent Monday morning
- **GitHub:** PRs for smart contract ABI updates
- **Docs:** Update requirements doc as protocol changes

### Escalation Path
```
Issue Found
    ↓
Document in Slack + GitHub issue
    ↓
Severity assessment:
    - P1 (Production down) → Page on-call engineer
    - P2 (Feature broken) → Assign to team next standup
    - P3 (Bug/minor issue) → Add to backlog
```

---

## 🎯 Success Criteria for Phase 3

- [ ] **Reliability:** 99.5% uptime sustained for 4 weeks
- [ ] **Performance:** API responses < 2s p95 consistently
- [ ] **Quality:** Error rate < 0.1%
- [ ] **User Satisfaction:** >90% users complete at least one unlock ceremony
- [ ] **Continuous Updates:** Deploy 3+ new unlocks without issues
- [ ] **Security:** Zero security incidents, all data verified on-chain
- [ ] **Cost Efficiency:** LLM costs under budget
- [ ] **Documentation:** All processes documented & team trained

---

## 📚 Reference Documents

**Required Reading:**
1. `/PHASE_3_TERMINAL_INTERFACE.md` - Architecture & design
2. `/BACKEND_REQUIREMENTS_PHASE_3.md` - API specifications
3. `/DEPLOYMENT_STATUS.md` - Infrastructure status
4. `/MULTI_AGENT_SETUP.md` - Multi-agent coordination

**Recommended Reading:**
1. `/README.md` - Project overview
2. `/SECURITY.md` - Security policies
3. `/docs/` - Protocol documentation

---

## 🚀 Phase 3 Readiness Checklist

### Pre-Launch (2 weeks before)
- [ ] Load testing completed successfully
- [ ] All APIs documented and reviewed
- [ ] Smart contract ABIs verified
- [ ] LLM integration tested
- [ ] Monitoring and alerting configured
- [ ] Incident response playbooks reviewed
- [ ] Team trained on new systems
- [ ] Stakeholders notified

### Launch Week (1 week before)
- [ ] Staging environment mirrors production
- [ ] All unlock ceremonies tested
- [ ] Database backed up
- [ ] Blue-green deployment configured
- [ ] Rollback plan documented
- [ ] On-call schedule confirmed
- [ ] Status page prepared
- [ ] Customer communication drafted

### Launch Day
- [ ] All systems operational
- [ ] Team on standby
- [ ] Monitoring dashboards open
- [ ] Incident response channels ready
- [ ] Real-time metrics tracking active
- [ ] User feedback collection active
- [ ] Documentation updated
- [ ] Success celebration planned! 🎉

---

## 🤝 Support & Questions

**If you have questions about:**
- **Backend APIs** → Reach out to backend team lead
- **Frontend components** → Reach out to frontend team lead
- **Infrastructure/Deployment** → Reach out to DevOps team
- **Smart contracts** → Reach out to blockchain engineer
- **LLM integration** → Reach out to AI/integration engineer

**Emergency Contacts:**
```
Backend Lead:   [slack: @backend-lead]
Frontend Lead:  [slack: @frontend-lead]
DevOps Lead:    [slack: @devops-lead]
On-Call:        [pagerduty rotation]
```

---

**Status:** Ready for Phase 3 Deployment
**Last Updated:** 2025-11-22
**Next Review:** 2025-11-29

---

## 📎 Appendix A: Useful Commands

### Check API Health
```bash
curl https://api.convergence.protocol/health
```

### Query User Profile
```bash
curl "https://api.convergence.protocol/api/blockchain/user-profile?address=0x1234..."
```

### Check Unlock Eligibility
```bash
curl "https://api.convergence.protocol/api/unlocks/eligibility?address=0x1234..."
```

### Monitor API Logs
```bash
tail -f /var/log/convergence-api.log | grep ERROR
```

### Restart Services
```bash
# API Service
sudo systemctl restart convergence-api

# Database
sudo systemctl restart postgresql

# Check all services
sudo systemctl status convergence-*
```

### Database Operations
```bash
# Backup
pg_dump convergence_db > backup_$(date +%Y%m%d).sql

# Check database size
SELECT pg_size_pretty(pg_database_size('convergence_db'));

# List tables
\dt

# Monitor connections
SELECT * FROM pg_stat_activity;
```

### Clear Cache (if needed)
```bash
# Redis
redis-cli FLUSHDB

# In-memory cache
curl -X POST https://api.convergence.protocol/cache/clear
```

---

**Your role is critical to Phase 3's success. Thank you for keeping everything running smoothly!**
