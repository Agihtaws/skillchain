// services/ipfsService.js
const pinata = require('../config/pinata');
const stream = require('stream');

async function uploadFileToIPFS(fileBuffer, fileName) {
    try {
        const readableStreamForFile = stream.Readable.from(fileBuffer);
        readableStreamForFile.name = fileName; // Pinata expects a name property

        const options = {
            pinataMetadata: {
                name: fileName,
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
        return `ipfs://${result.IpfsHash}`;
    } catch (error) {
        console.error("Error uploading file to IPFS:", error);
        throw new Error("Failed to upload file to IPFS.");
    }
}

async function uploadJsonToIPFS(jsonObject, name) {
    try {
        const pinataOptions = {
            pinataMetadata: {
                name: name
            }
        };
        const result = await pinata.pinJSONToIPFS(jsonObject, pinataOptions);
        return `ipfs://${result.IpfsHash}`;
    } catch (error) {
        console.error("Error uploading JSON to IPFS:", error);
        throw new Error("Failed to upload JSON to IPFS.");
    }
}

module.exports = {
    uploadFileToIPFS,
    uploadJsonToIPFS
};
