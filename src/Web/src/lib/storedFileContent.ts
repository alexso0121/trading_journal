const STORED_FILE_PREFIX = 'stored-file:';

const parseHtml = (value: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(value || '<p></p>', 'text/html');
};

export const extractStoredFileIds = (value: string) => {
  const document = parseHtml(value);
  const fileIds = new Set<string>();

  for (const image of document.querySelectorAll('img')) {
    const dataFileId = image.getAttribute('data-file-id')?.trim();
    if (dataFileId) {
      fileIds.add(dataFileId);
      continue;
    }

    const src = image.getAttribute('src')?.trim() ?? '';
    if (src.startsWith(STORED_FILE_PREFIX)) {
      fileIds.add(src.slice(STORED_FILE_PREFIX.length));
    }
  }

  return [...fileIds];
};

export const normalizeStoredFileContentForSave = (value: string) => {
  const document = parseHtml(value);

  for (const image of document.querySelectorAll('img')) {
    const dataFileId = image.getAttribute('data-file-id')?.trim();
    if (!dataFileId) {
      continue;
    }

    image.setAttribute('src', `${STORED_FILE_PREFIX}${dataFileId}`);
  }

  return document.body.innerHTML;
};

export const resolveStoredFileContent = (value: string, resolvedUrls: Map<string, string>) => {
  const document = parseHtml(value);

  for (const image of document.querySelectorAll('img')) {
    const dataFileId = image.getAttribute('data-file-id')?.trim();
    const src = image.getAttribute('src')?.trim() ?? '';
    const fileId =
      dataFileId ||
      (src.startsWith(STORED_FILE_PREFIX) ? src.slice(STORED_FILE_PREFIX.length) : '');

    if (!fileId) {
      continue;
    }

    const resolvedUrl = resolvedUrls.get(fileId);
    if (!resolvedUrl) {
      continue;
    }

    image.setAttribute('src', resolvedUrl);
    image.setAttribute('data-file-id', fileId);
  }

  return document.body.innerHTML;
};
