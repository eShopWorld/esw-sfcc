const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const readline = require('readline');
require('dotenv').config();


const CONFLUENCE_EMAIL = "cbianchi@eshopworld.com";
const CONFLUENCE_API_TOKEN = "ATATT3xFfGF03gj0BfZVn5VFhoyKzB1Jj0L4n9smdshFnhP3HzujdMrsXLwkKNCKeP14wvaQfMpKDAw2M6W_JmsxhZdrrWST5xjYixUlhYd4Pjaid5QEap5c1YxlfLpWlglImcpbnuWh54BIrVq-qZ2pS6YfXNyTKknLHvAkjD4hbNUr54biyT8=5F275BA1";
const CONFLUENCE_CONTENT_ID = "3245867127";
const CONFLUENCE_BASE_URL = "https://eshopworld.atlassian.net/wiki/rest/api/content";
const RELEASE_VERSION = "4.7.0";
const getAuthHeader = () => `Basic ${Buffer.from(`${CONFLUENCE_EMAIL}:${CONFLUENCE_API_TOKEN}`).toString('base64')}`;



const checkExistingAttachments = async () => {
    const url = `${CONFLUENCE_BASE_URL}/${CONFLUENCE_CONTENT_ID}/child/attachment`;
    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': getAuthHeader() },
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching attachments:', error.response ? error.response.data : error.message);
        return [];
    }
};

const uploadOrReplaceFile = async () => {
    const logFolderPath = path.join(__dirname, 'generated-logs');
    const filePath = path.join(logFolderPath, `${RELEASE_VERSION}-unit-tests.log`);
    const fileName = `${RELEASE_VERSION}-unit-tests.log`;
    const url = `${CONFLUENCE_BASE_URL}/${CONFLUENCE_CONTENT_ID}/child/attachment`;
    const existingAttachments = await checkExistingAttachments();
    const existingFile = existingAttachments.find(attachment => attachment.title === fileName);


    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('comment', existingFile ? 'Replacing existing file' : 'Uploading new file');

    const uploadUrl = existingFile ? `${url}/${existingFile.id}/data` : url;
    const params = existingFile ? {} : { minorEdit: true };

    try {
        const response = await axios.post(uploadUrl, formData, {
            headers: {
                'Authorization': getAuthHeader(),
                'X-Atlassian-Token': 'no-check',
                ...formData.getHeaders(),
            },
            params,
        });
        console.log(`File ${existingFile ? 'replaced' : 'uploaded'} successfully:`, response.data);

        // Extract the URL of the uploaded file
        const baseUrl = response.data._links.base;
        const webuiPath = response.data._links.webui;
        const pageId = `pages/viewpageattachments.action?pageId=${CONFLUENCE_CONTENT_ID}`;
        if (webuiPath) {
            const fileUrl = new URL(`${baseUrl}${webuiPath}`);
            console.log(`The file has been uploaded and can be accessed at: ${fileUrl}`);
        } else {
            console.log(`The file has been uploaded and can be accessed at: ${baseUrl}/${pageId}`);
        }
    } catch (error) {
        console.error('Error uploading/replacing file:', error.response ? error.response.data : error.message);
    }
};

uploadOrReplaceFile();