const { Storage } = require('@google-cloud/storage');

const storage = new Storage();

/**
 * HTTP Cloud Function to generate a v4 signed URL for file uploads.
 *
 * @param {object} req The HTTP request object.
 * @param {object} res The HTTP response object.
 */
exports.generateSignedUrl = async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-control-allow-headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        // Handle preflight request
        res.status(204).send('');
        return;
    }

    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
        res.status(400).send('Missing fileName or contentType in request body.');
        return;
    }

    const bucketName = process.env.BUCKET_NAME; // Will be set via environment variable
    if (!bucketName) {
        res.status(500).send('BUCKET_NAME environment variable not set.');
        return;
    }

    const options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
    };

    try {
        const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);
        res.status(200).send({ url });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).send('Failed to generate signed URL.');
    }
};
