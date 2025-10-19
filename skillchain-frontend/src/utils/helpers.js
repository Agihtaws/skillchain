// src/utils/helpers.js

export const shortenAddress = (address, chars = 4) => {
  if (!address || address.length < chars * 2 + 2) {
    return address;
  }
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(parseInt(timestamp) * 1000); // Convert Unix timestamp to milliseconds
  return date.toLocaleString(); // Format to local date and time string
};

export const parseIpfsUrl = (ipfsUri) => {
  if (!ipfsUri) return '';
  // Convert ipfs://<hash> to https://gateway.pinata.cloud/ipfs/<hash>
  if (ipfsUri.startsWith('ipfs://')) {
    const hash = ipfsUri.substring(7);
    // A simple heuristic for a valid CID: check length and if it contains spaces
    if (hash.length > 20 && !hash.includes(' ')) {
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    } else {
      console.warn(`[IPFS Helper] Invalid IPFS hash format in URI: "${ipfsUri}". Returning empty URL.`);
      return ''; // Return empty for clearly invalid IPFS URIs
    }
  }
  // If it's already an HTTP URL, return as is
  if (ipfsUri.startsWith('http://') || ipfsUri.startsWith('https://')) {
    return ipfsUri;
  }
  // If it's a non-IPFS, non-HTTP string (like "QmStanford123"), treat as invalid.
  console.warn(`[IPFS Helper] Unrecognized metadata URI format: "${ipfsUri}". Returning empty URL.`);
  return '';
};

export const fetchIpfsJson = async (ipfsUri) => {
  if (!ipfsUri || ipfsUri.trim() === '') {
    console.warn("[IPFS Helper] Attempted to fetch IPFS JSON with empty URI. Skipping.");
    return null;
  }

  try {
    const url = parseIpfsUrl(ipfsUri);
    if (!url) {
      console.warn(`[IPFS Helper] parseIpfsUrl returned empty URL for: "${ipfsUri}". Cannot fetch IPFS JSON.`);
      return null;
    }
    const response = await fetch(url);
    if (!response.ok) {
      // Log the specific status for debugging
      console.error(`[IPFS Helper] HTTP error! status: ${response.status} for IPFS URI: ${url}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[IPFS Helper] Error fetching IPFS JSON for URI: "${ipfsUri}"`, error);
    return null;
  }
};
