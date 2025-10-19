// src/hooks/useContractWrite.js
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Helper to get contract address and ABI from environment (or a config file)
// IMPORTANT: Replace with your actual contract addresses and ABIs
const CONTRACT_CONFIG = {
  IssuerRegistry: {
    address: import.meta.env.VITE_ISSUER_REGISTRY_ADDRESS,
    abi: [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousAdmin",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newAdmin",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "transferDate",
          "type": "uint256"
        }
      ],
      "name": "AdminTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "deactivatedDate",
          "type": "uint256"
        }
      ],
      "name": "IssuerDeactivated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "reactivatedDate",
          "type": "uint256"
        }
      ],
      "name": "IssuerReactivated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "universityName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "registrationDate",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "metadataURI",
          "type": "string"
        }
      ],
      "name": "IssuerRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "removedDate",
          "type": "uint256"
        }
      ],
      "name": "IssuerRemoved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "verificationLevel",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "verifiedDate",
          "type": "uint256"
        }
      ],
      "name": "IssuerVerified",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "oldScore",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newScore",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "updatedDate",
          "type": "uint256"
        }
      ],
      "name": "ReputationScoreUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "oldLevel",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newLevel",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "updatedDate",
          "type": "uint256"
        }
      ],
      "name": "VerificationLevelUpdated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "admin",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        }
      ],
      "name": "deactivateIssuer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getActiveIssuers",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllIssuers",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        }
      ],
      "name": "getIssuer",
      "outputs": [
        {
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "universityName",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "isVerified",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "registrationDate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "verificationLevel",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reputationScore",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "metadataURI",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        }
      ],
      "name": "getIssuerReputationScore",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        }
      ],
      "name": "getIssuerVerificationLevel",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getVerifiedIssuers",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        }
      ],
      "name": "isAuthorizedIssuer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "issuers",
      "outputs": [
        {
          "internalType": "address",
          "name": "issuerAddress",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "universityName",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "isVerified",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "registrationDate",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "verificationLevel",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "reputationScore",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "metadataURI",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        }
      ],
      "name": "reactivateIssuer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_universityName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_metadataURI",
          "type": "string"
        }
      ],
      "name": "registerIssuer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        }
      ],
      "name": "removeIssuer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalIssuers",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newAdmin",
          "type": "address"
        }
      ],
      "name": "transferAdmin",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "uniqueIssuerAddresses",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_newScore",
          "type": "uint256"
        }
      ],
      "name": "updateReputationScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_newLevel",
          "type": "uint256"
        }
      ],
      "name": "updateVerificationLevel",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_verificationLevel",
          "type": "uint256"
        }
      ],
      "name": "verifyIssuer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  },
  CredentialNFT: {
    address: import.meta.env.VITE_CREDENTIAL_NFT_ADDRESS,
    abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerRegistryAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "approved",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "tokenIds",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "address[]",
          "name": "recipients",
          "type": "address[]"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "mintDate",
          "type": "uint256"
        }
      ],
      "name": "BatchCredentialsMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_fromTokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_toTokenId",
          "type": "uint256"
        }
      ],
      "name": "BatchMetadataUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "credentialType",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "mintDate",
          "type": "uint256"
        }
      ],
      "name": "CredentialMinted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "revokedDate",
          "type": "uint256"
        }
      ],
      "name": "CredentialRevoked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "MetadataUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "_recipients",
          "type": "address[]"
        },
        {
          "internalType": "string[]",
          "name": "_credentialTypes",
          "type": "string[]"
        },
        {
          "internalType": "string[]",
          "name": "_tokenURIs",
          "type": "string[]"
        }
      ],
      "name": "batchMintCredentials",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "credentialMetadata",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "mintDate",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "credentialType",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "isValid",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "getApproved",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "getCredentialMetadata",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "mintDate",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "credentialType",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "isValid",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuer",
          "type": "address"
        }
      ],
      "name": "getIssuerCredentials",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_recipient",
          "type": "address"
        }
      ],
      "name": "getRecipientCredentials",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalCredentials",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "isCredentialValid",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "issuerRegistryAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "issuerTokens",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_recipient",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_credentialType",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_tokenURI",
          "type": "string"
        }
      ],
      "name": "mintCredential",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ownerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "recipientTokens",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "revokeCredential",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "tokenExists",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "verifyCredential",
      "outputs": [
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "credentialType",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "mintDate",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isValid",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "credentialTokenURI",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  },
  CredentialRegistry: {
    address: import.meta.env.VITE_CREDENTIAL_REGISTRY_ADDRESS,
    abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerRegistryAddress",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "credentialId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "degreeName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "metadataURI",
          "type": "string"
        }
      ],
      "name": "CredentialIssued",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "credentialId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "revokedDate",
          "type": "uint256"
        }
      ],
      "name": "CredentialRevoked",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "credentialExists",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "credentials",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "credentialId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "degreeName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isRevoked",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "metadataURI",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "getCredential",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "credentialId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "degreeName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isRevoked",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "metadataURI",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuer",
          "type": "address"
        }
      ],
      "name": "getIssuerCredentials",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_recipient",
          "type": "address"
        }
      ],
      "name": "getRecipientCredentials",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalCredentials",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "isCredentialValid",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_recipient",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_degreeName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_metadataURI",
          "type": "string"
        }
      ],
      "name": "issueCredential",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "issuerCredentials",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "issuerRegistryAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "recipientCredentials",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "revokeCredential",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  },
  VerificationContract: { // <<< ADD THIS CONTRACT CONFIG
    address: import.meta.env.VITE_VERIFICATION_CONTRACT_ADDRESS,
    abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_credentialNFTAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_issuerRegistryAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_credentialRegistryAddress",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_frontendBaseUrl",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "PrivacySettingsUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "credentialId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "proofHash",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "VerificationProofGenerated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "verifier",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "credentialId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "successful",
          "type": "bool"
        }
      ],
      "name": "VerificationRequested",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256[]",
          "name": "_credentialIds",
          "type": "uint256[]"
        }
      ],
      "name": "batchVerifyCredentials",
      "outputs": [
        {
          "internalType": "bool[]",
          "name": "",
          "type": "bool[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "credentialNFTAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "credentialRegistryAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "frontendBaseUrl",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "generateQRCodeData",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "generateVerificationProof",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "credentialId",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "recipient",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "issuer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "issuerName",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "credentialType",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "mintDate",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isValid",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "issuerVerified",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "issuerReputationScore",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "verificationLevel",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "proofTimestamp",
              "type": "uint256"
            },
            {
              "internalType": "bytes32",
              "name": "proofHash",
              "type": "bytes32"
            }
          ],
          "internalType": "struct VerificationContract.VerificationProof",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "getCredentialVerificationCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "getFullVerificationDetails",
      "outputs": [
        {
          "internalType": "bool",
          "name": "isValid",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "issuerName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "credentialType",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "mintDate",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "issuerVerified",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "issuerActive",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "issuerReputationScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "verificationLevel",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "getPrivacySettings",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "showRecipientAddress",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "showIssuerAddress",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "showMintDate",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "showCredentialType",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "showIssuerName",
              "type": "bool"
            }
          ],
          "internalType": "struct VerificationContract.PrivacySettings",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "getPublicVerificationDetailsView",
      "outputs": [
        {
          "internalType": "bool",
          "name": "isValid",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "credentialType",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "mintDate",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "issuerName",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "issuerVerified",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTotalVerifications",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_verifier",
          "type": "address"
        }
      ],
      "name": "getVerificationCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "getVerificationHistory",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "verifier",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "credentialId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "successful",
              "type": "bool"
            }
          ],
          "internalType": "struct VerificationContract.VerificationRequest[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "issuerRegistryAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_credentialId",
          "type": "uint256"
        }
      ],
      "name": "recordPublicVerification",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "_showRecipientAddress",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_showIssuerAddress",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_showMintDate",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_showCredentialType",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "_showIssuerName",
          "type": "bool"
        }
      ],
      "name": "setPrivacySettings",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalVerifications",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userPrivacySettings",
      "outputs": [
        {
          "internalType": "bool",
          "name": "showRecipientAddress",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "showIssuerAddress",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "showMintDate",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "showCredentialType",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "showIssuerName",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "verificationCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "verificationHistory",
      "outputs": [
        {
          "internalType": "address",
          "name": "verifier",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "credentialId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "successful",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerAddress",
          "type": "address"
        }
      ],
      "name": "verifyIssuerAuthorization",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],

},
};

const VITE_ISSUER_REGISTRY_ADDRESS = import.meta.env.VITE_ISSUER_REGISTRY_ADDRESS;
const VITE_CREDENTIAL_NFT_ADDRESS = import.meta.env.VITE_CREDENTIAL_NFT_ADDRESS;
const VITE_CREDENTIAL_REGISTRY_ADDRESS = import.meta.env.VITE_CREDENTIAL_REGISTRY_ADDRESS;
const VITE_VERIFICATION_CONTRACT_ADDRESS = import.meta.env.VITE_VERIFICATION_CONTRACT_ADDRESS;

export function useContractWrite(contractName, functionName) {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [data, setData] = useState(null); // Transaction hash or result

  const contractConfig = CONTRACT_CONFIG[contractName];

  if (!contractConfig) {
    console.error(`Invalid contract name: ${contractName}`);
    throw new Error(`Invalid contract name: ${contractName}`);
  }

  const {
    writeContract,
    data: hash,
    isPending: writePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: confirmLoading,
    isSuccess: confirmSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: hash,
  });

  useEffect(() => {
    if (writePending) {
      setStatus('loading');
      setMessage('Waiting for wallet confirmation...');
    } else if (writeError) {
      setStatus('error');
      setMessage(writeError.shortMessage || writeError.message || 'Transaction failed in wallet.');
      console.error("Write error:", writeError);
    } else if (hash) {
      setStatus('loading');
      setMessage(`Transaction sent! Waiting for confirmation... Hash: ${shortenAddress(hash)}`);
      setData(hash);
    }
  }, [writePending, writeError, hash]);

  useEffect(() => {
    if (confirmLoading) {
      setStatus('loading');
      setMessage(`Confirming transaction... Hash: ${shortenAddress(hash)}`);
    } else if (confirmError) {
      setStatus('error');
      setMessage(confirmError.shortMessage || confirmError.message || 'Transaction failed on-chain.');
      console.error("Confirmation error:", confirmError);
    } else if (confirmSuccess) {
      setStatus('success');
      setMessage(`Transaction confirmed! Hash: ${shortenAddress(hash)}`);
    }
  }, [confirmLoading, confirmError, confirmSuccess, hash]);

  const execute = async (...args) => {
    setStatus('idle');
    setMessage('');
    setData(null);
    resetWrite(); // Reset previous write state

    try {
      if (!contractConfig.address || !contractConfig.abi) {
        throw new Error(`Contract configuration missing for ${contractName}`);
      }
      writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: functionName,
        args: args,
      });
    } catch (e) {
      setStatus('error');
      setMessage(e.message || 'Failed to prepare transaction.');
      console.error("Execute error:", e);
    }
  };

  const shortenAddress = (addr, chars = 4) => {
    if (!addr || addr.length < chars * 2 + 2) {
      return addr;
    }
    return `${addr.substring(0, chars + 2)}...${addr.substring(addr.length - chars)}`;
  };

  return { execute, status, message, data, isLoading: writePending || confirmLoading, isSuccess: confirmSuccess, isError: writeError || confirmError };
}