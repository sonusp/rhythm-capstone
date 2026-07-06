export const uploadBackupToDrive = async (accessToken, dbData) => {
  // First check if it already exists
  const existingFilesResponse = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name="google_rhythm_backup.json"', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  const existingFilesData = await existingFilesResponse.json();
  const fileId = existingFilesData.files?.length > 0 ? existingFilesData.files[0].id : null;

  const boundary = 'foo_bar_baz';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const fileMetadata = fileId 
    ? { name: 'google_rhythm_backup.json' } // PATCH doesn't allow 'parents'
    : { name: 'google_rhythm_backup.json', parents: ['appDataFolder'] };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(dbData) +
    close_delim;

  const url = fileId 
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
  const method = fileId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload backup to Drive: ${errText}`);
  }

  return response.json();
};

export const downloadBackupFromDrive = async (accessToken) => {
  // 1. Find the file
  const listResponse = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name="google_rhythm_backup.json"', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  const listData = await listResponse.json();
  if (!listData.files || listData.files.length === 0) {
    throw new Error('No backup found in Google Drive.');
  }
  
  const fileId = listData.files[0].id;
  
  // 2. Download the file content
  const dlResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!dlResponse.ok) {
    throw new Error('Failed to download backup from Drive');
  }
  
  return await dlResponse.json();
};
