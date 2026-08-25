# Phase 9: Blockchain Integration (Optional)

## Status: ⬜ PENDING (Optional Enhancement)

## Objective
Add blockchain-based immutable audit log for interview results and hiring decisions.

## ⚠️ Important: Blockchain Usage Guidelines

### ✅ DO Use Blockchain For:
1. **Interview result hashes** (immutable proof of evaluation)
2. **Hiring decision timestamps** (audit trail)
3. **Credential verification** (education, certifications)
4. **Application status changes** (tamper-proof history)

### ❌ DO NOT Use Blockchain For:
1. **Personal data storage** (GDPR/privacy violation)
2. **Resume content** (too large, privacy issues)
3. **Real-time operations** (blockchain is slow)
4. **All database operations** (overkill)

## Why Blockchain?

**Judge Line:** *"We use blockchain for immutable audit logs of hiring decisions."*

**Real Use Cases:**
1. **Compliance:** Prove hiring process was fair and unbiased
2. **Audit Trail:** Immutable record of who evaluated whom and when
3. **Credential Verification:** Verify candidate certificates are genuine
4. **Transparency:** Candidates can verify their evaluation was recorded
5. **Legal Protection:** Tamper-proof evidence for disputes

## Architecture

```
PostgreSQL (Primary Data Store)
    ↓
Application Event (Interview Completed)
    ↓
Generate Hash of Result
    ↓
Store Hash on Blockchain
    ↓
Store Blockchain TX ID in PostgreSQL
```

**Key Principle:** PostgreSQL stores data, blockchain stores proof.

## Implementation Options

### Option 1: Ethereum (Public Blockchain)
**Pros:**
- Most recognized blockchain
- Immutable and transparent
- Many libraries (ethers.js, web3.js)

**Cons:**
- Gas fees ($1-10 per transaction)
- Slower (15-30 seconds per block)
- Environmental concerns (proof-of-work)

### Option 2: Polygon (Layer 2)
**Pros:**
- Almost free transactions (~$0.001)
- Faster (2-3 seconds)
- Ethereum-compatible
- **RECOMMENDED FOR HACKATHON**

**Cons:**
- Less decentralized than Ethereum

### Option 3: Hyperledger Fabric (Private)
**Pros:**
- No gas fees
- Fast
- Enterprise-ready

**Cons:**
- More complex setup
- Not truly "decentralized"
- Judges may not recognize it

## Recommended: Polygon Implementation

### 1. Install Dependencies
```bash
npm install ethers dotenv
```

### 2. Smart Contract (Solidity)
**File:** `blockchain/contracts/AuditLog.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HireSenseAuditLog {
    struct AuditEntry {
        bytes32 dataHash;      // Hash of interview result
        uint256 timestamp;     // Block timestamp
        address recorder;      // Who recorded this
    }

    mapping(bytes32 => AuditEntry) public auditLog;
    bytes32[] public auditHashes;

    event AuditRecorded(
        bytes32 indexed dataHash,
        uint256 timestamp,
        address indexed recorder
    );

    /**
     * Record an audit entry on the blockchain
     * @param dataHash SHA-256 hash of the data to audit
     */
    function recordAudit(bytes32 dataHash) public {
        require(auditLog[dataHash].timestamp == 0, "Entry already exists");

        auditLog[dataHash] = AuditEntry({
            dataHash: dataHash,
            timestamp: block.timestamp,
            recorder: msg.sender
        });

        auditHashes.push(dataHash);

        emit AuditRecorded(dataHash, block.timestamp, msg.sender);
    }

    /**
     * Verify if an audit entry exists
     * @param dataHash Hash to verify
     * @return exists Whether the entry exists
     * @return timestamp When it was recorded
     */
    function verifyAudit(bytes32 dataHash)
        public
        view
        returns (bool exists, uint256 timestamp)
    {
        AuditEntry memory entry = auditLog[dataHash];
        return (entry.timestamp > 0, entry.timestamp);
    }

    /**
     * Get total audit entries
     */
    function getTotalAudits() public view returns (uint256) {
        return auditHashes.length;
    }
}
```

### 3. Deploy Script
**File:** `blockchain/scripts/deploy.ts`
```typescript
import { ethers } from 'hardhat';

async function main() {
  const AuditLog = await ethers.getContractFactory('HireSenseAuditLog');
  const auditLog = await AuditLog.deploy();

  await auditLog.deployed();

  console.log('AuditLog deployed to:', auditLog.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 4. Backend Integration
**File:** `backend/src/services/blockchain.service.ts`
```typescript
import { ethers } from 'ethers';
import crypto from 'crypto';

export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    // Connect to Polygon Mumbai testnet (or mainnet)
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com'
    );

    // Create wallet from private key
    this.wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, this.provider);

    // Load contract
    const contractABI = [
      'function recordAudit(bytes32 dataHash) public',
      'function verifyAudit(bytes32 dataHash) public view returns (bool exists, uint256 timestamp)',
      'event AuditRecorded(bytes32 indexed dataHash, uint256 timestamp, address indexed recorder)',
    ];

    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS!,
      contractABI,
      this.wallet
    );
  }

  /**
   * Generate SHA-256 hash of data
   */
  private generateHash(data: any): string {
    const jsonString = JSON.stringify(data);
    return '0x' + crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Record interview result on blockchain
   */
  async recordInterviewResult(interviewId: string, result: any): Promise<string> {
    try {
      // Create hash of result (not the full data!)
      const dataToHash = {
        interviewId,
        candidateId: result.candidateId,
        jobId: result.jobId,
        score: result.score,
        evaluatedAt: result.evaluatedAt,
      };

      const hash = this.generateHash(dataToHash);

      // Record on blockchain
      const tx = await this.contract.recordAudit(hash);
      const receipt = await tx.wait();

      console.log(`Blockchain TX: ${receipt.transactionHash}`);

      return receipt.transactionHash;
    } catch (error) {
      console.error('Blockchain recording failed:', error);
      throw new Error('Failed to record on blockchain');
    }
  }

  /**
   * Verify interview result exists on blockchain
   */
  async verifyInterviewResult(interviewId: string, result: any): Promise<{
    exists: boolean;
    timestamp?: Date;
  }> {
    try {
      const dataToHash = {
        interviewId,
        candidateId: result.candidateId,
        jobId: result.jobId,
        score: result.score,
        evaluatedAt: result.evaluatedAt,
      };

      const hash = this.generateHash(dataToHash);

      const [exists, timestampBigNumber] = await this.contract.verifyAudit(hash);

      if (exists) {
        const timestamp = new Date(timestampBigNumber.toNumber() * 1000);
        return { exists: true, timestamp };
      }

      return { exists: false };
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      return { exists: false };
    }
  }

  /**
   * Get wallet balance (for monitoring gas)
   */
  async getBalance(): Promise<string> {
    const balance = await this.wallet.getBalance();
    return ethers.utils.formatEther(balance);
  }
}
```

### 5. Integration into Interview Flow
**File:** `backend/src/services/interview.service.ts`
```typescript
import { BlockchainService } from './blockchain.service';
import { prisma } from '../config/database';

export class InterviewService {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async completeInterview(interviewId: string, evaluation: any): Promise<void> {
    // 1. Save evaluation to PostgreSQL
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: 'completed',
        score: evaluation.score,
        feedback: evaluation.feedback,
        completedAt: new Date(),
      },
    });

    // 2. Record hash on blockchain (async, non-blocking)
    try {
      const txHash = await this.blockchainService.recordInterviewResult(interviewId, {
        candidateId: interview.applicantId,
        jobId: interview.jobId,
        score: evaluation.score,
        evaluatedAt: interview.completedAt,
      });

      // 3. Store blockchain TX ID in database
      await prisma.interview.update({
        where: { id: interviewId },
        data: { blockchainTxHash: txHash },
      });

      console.log(`Interview ${interviewId} recorded on blockchain: ${txHash}`);
    } catch (error) {
      // Don't fail the interview if blockchain fails
      console.error('Blockchain recording failed (non-critical):', error);
    }
  }

  /**
   * Verify interview result integrity
   */
  async verifyInterview(interviewId: string): Promise<{
    valid: boolean;
    blockchainTimestamp?: Date;
  }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return { valid: false };
    }

    const verification = await this.blockchainService.verifyInterviewResult(interviewId, {
      candidateId: interview.applicantId,
      jobId: interview.jobId,
      score: interview.score,
      evaluatedAt: interview.completedAt,
    });

    return {
      valid: verification.exists,
      blockchainTimestamp: verification.timestamp,
    };
  }
}
```

## Database Schema Update

**Add to Prisma schema:**
```prisma
model Interview {
  id               String    @id @default(uuid())
  jobId            String
  applicantId      String
  status           InterviewStatus
  score            Float?
  feedback         String?
  completedAt      DateTime?
  blockchainTxHash String?   // Blockchain transaction ID
  
  // ... other fields
}
```

## Environment Variables

```env
# Polygon Mumbai Testnet (for testing)
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=0x_deployed_contract_address

# Polygon Mainnet (for production)
# POLYGON_RPC_URL=https://polygon-rpc.com
```

## Cost Analysis

### Polygon Mumbai (Testnet)
- Free MATIC from faucet
- $0.00 per transaction

### Polygon Mainnet
- ~$0.001 per transaction
- 100 interviews = $0.10
- 10,000 interviews = $10

**Cost is negligible.**

## Candidate Verification Portal

**File:** `src/pages/VerifyInterview.tsx`
```typescript
import { useState } from 'react';
import { api } from '../lib/api';

export function VerifyInterview() {
  const [interviewId, setInterviewId] = useState('');
  const [verification, setVerification] = useState<any>(null);

  const handleVerify = async () => {
    const result = await api.get(`/interviews/${interviewId}/verify`);
    setVerification(result.data);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Verify Interview Result</h1>

      <input
        type="text"
        placeholder="Enter Interview ID"
        value={interviewId}
        onChange={(e) => setInterviewId(e.target.value)}
        className="border p-2 rounded"
      />

      <button onClick={handleVerify} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded">
        Verify
      </button>

      {verification && (
        <div className="mt-4 p-4 border rounded">
          {verification.valid ? (
            <div className="text-green-600">
              ✅ Interview result verified on blockchain
              <p className="text-sm mt-2">
                Recorded at: {new Date(verification.blockchainTimestamp).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="text-red-600">❌ Interview result not found on blockchain</div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Judge Talking Points

> **"We use blockchain to create an immutable audit trail of hiring decisions."**

**Show:**
- Smart contract code (simple, easy to understand)
- Verification portal (candidate can verify their result)
- Blockchain explorer link (show real transaction)

**Explain:**
- "We hash interview results and record them on Polygon blockchain"
- "This provides immutable proof that evaluation happened and wasn't tampered with"
- "Candidates get transparency - they can verify their result independently"
- "Costs less than $0.001 per transaction using Polygon Layer 2"
- "We only store hashes, not personal data, for privacy compliance"

## Privacy Compliance

### What Goes on Blockchain (Public)
- ✅ Hash of interview result
- ✅ Timestamp
- ✅ Transaction ID

### What Stays in Database (Private)
- ❌ Candidate name
- ❌ Resume content
- ❌ Interview answers
- ❌ Personal information

**NEVER put personal data on blockchain.**

## Testing

```bash
# Deploy contract to Mumbai testnet
npx hardhat run scripts/deploy.ts --network mumbai

# Get test MATIC from faucet
# Visit: https://faucet.polygon.technology/

# Test recording
curl -X POST http://localhost:5000/api/interviews/123/complete \
  -H "Content-Type: application/json" \
  -d '{"score": 85, "feedback": "Great candidate"}'

# Test verification
curl http://localhost:5000/api/interviews/123/verify
```

## Next Steps
Proceed to [Phase 10: Git Best Practices](./PHASE_10_GIT_PRACTICES.md) for commit strategy.
