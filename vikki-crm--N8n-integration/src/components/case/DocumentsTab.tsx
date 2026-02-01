import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Image, FileCheck, Trash2, Download, Eye, FolderOpen, X, Maximize2, Minimize2, Calendar, User, Tag } from 'lucide-react';
import { supabase } from '../../utils/database';
import { useConfirmDialog } from '../../hooks/useConfirmDialog.tsx';

interface Document {
  id: number;
  casefile_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  category: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

interface GeneratedDocument {
  id: number;
  casefile_id: number;
  document_type: string;
  document_name: string;
  file_path: string;
  file_url: string;
  generated_by: string;
  generated_at: string;
  metadata: any;
}

interface DocumentsTabProps {
  casefileId: number;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

const categories = ['All', 'Letters', 'Medical', 'Photos', 'Court', 'Other'];

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
  if (fileType.includes('image')) return <Image className="w-8 h-8 text-blue-500" />;
  if (fileType.includes('word') || fileType.includes('doc')) return <FileCheck className="w-8 h-8 text-blue-600" />;
  return <FileText className="w-8 h-8 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    Letters: 'bg-blue-100 text-blue-800',
    Medical: 'bg-green-100 text-green-800',
    Photos: 'bg-purple-100 text-purple-800',
    Court: 'bg-red-100 text-red-800',
    Other: 'bg-gray-100 text-gray-800'
  };
  return colors[category] || colors.Other;
};

const detectCategory = (file: File): string => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (fileType.includes('image') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
    return 'Photos';
  } else if (fileType.includes('pdf')) {
    return 'Letters';
  } else if (fileType.includes('word') || fileType.includes('doc') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    return 'Letters';
  }

  return 'Other';
};

const logError = (context: string, error: any) => {
  console.error(`[${context}] Error:`, {
    message: error?.message,
    stack: error?.stack,
    details: error
  });
};

export default function DocumentsTab({ casefileId, onShowToast }: DocumentsTabProps) {
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | GeneratedDocument | null>(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeStorageBucket();
    fetchDocuments();
    fetchGeneratedDocuments();
  }, [casefileId]);

  useEffect(() => {
    let filtered = documents;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.file_name.toLowerCase().includes(term) ||
        doc.uploaded_by.toLowerCase().includes(term) ||
        doc.category.toLowerCase().includes(term)
      );
    }
    
    setFilteredDocuments(filtered);
  }, [selectedCategory, documents, searchTerm]);

  const initializeStorageBucket = async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === 'case-documents');

      if (bucketExists) {
        console.log('✓ Storage ready');
      }
    } catch (error) {
      // Silent fail - bucket will be checked on upload
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('casefile_id', casefileId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
      console.log('Loaded documents:', data?.length || 0);
    } catch (error) {
      logError('Fetch Documents', error);
      onShowToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneratedDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('casefile_id', casefileId)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      setGeneratedDocuments(data || []);
      console.log('Loaded generated documents:', data?.length || 0);
    } catch (error) {
      logError('Fetch Generated Documents', error);
      // Don't show toast for this as it's not critical
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    const filesArray = Array.from(files);
    let successCount = 0;
    let failCount = 0;

    for (const file of filesArray) {
      try {
        if (file.size > 10 * 1024 * 1024) {
          onShowToast(`${file.name} is too large (max 10MB)`, 'error');
          failCount++;
          continue;
        }

        // Auto-detect category based on file type
        const category = detectCategory(file);

        const fileExt = file.name.split('.').pop();
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `case-${casefileId}/${uniqueName}`;

        console.log(`Uploading ${file.name} (${category}) to:`, filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          logError('File Upload', uploadError);
          onShowToast(`Failed to upload ${file.name}: ${uploadError.message}`, 'error');
          failCount++;
          continue;
        }

        console.log('Upload successful:', uploadData);

        const { data: urlData } = supabase.storage
          .from('case-documents')
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            casefile_id: casefileId,
            file_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            file_url: publicUrl,
            storage_path: filePath,
            category: category,
            uploaded_by: 'Admin',
            uploaded_at: new Date().toISOString()
          });

        if (dbError) {
          logError('Database Insert', dbError);

          await supabase.storage
            .from('case-documents')
            .remove([filePath]);

          onShowToast(`Failed to save ${file.name} to database`, 'error');
          failCount++;
          continue;
        }

        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: `Document uploaded: ${file.name} (${category})`,
          timestamp: new Date().toISOString(),
          user_name: 'Admin'
        });

        successCount++;
      } catch (error) {
        logError('File Upload Process', error);
        onShowToast(`Failed to upload ${file.name}`, 'error');
        failCount++;
      }
    }

    setUploading(false);

    if (successCount > 0) {
      onShowToast(`${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully`, 'success');
      await fetchDocuments();
    }

    if (failCount > 0 && successCount === 0) {
      onShowToast(`Failed to upload ${failCount} document${failCount > 1 ? 's' : ''}`, 'error');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleView = (doc: Document | GeneratedDocument) => {
    setPreviewDocument(doc);
  };

  const handlePreviewClose = () => {
    setPreviewDocument(null);
    setIsPreviewFullscreen(false);
  };

  const handlePreviewFullscreen = () => {
    setIsPreviewFullscreen(!isPreviewFullscreen);
  };

  const isPdfDocument = (doc: Document | GeneratedDocument) => {
    return doc.file_type?.includes('pdf') || doc.file_name?.toLowerCase().endsWith('.pdf');
  };

  const handleDownload = async (doc: Document | GeneratedDocument) => {
    try {
      // For Supabase public URLs, we need to fetch as blob and create object URL
      const response = await fetch(doc.file_url);

      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Downloaded:', doc.file_name);
    } catch (error) {
      logError('Download File', error);
      onShowToast('Failed to download file. Please try viewing instead.', 'error');
    }
  };

  const handleCategoryChange = async (docId: number, newCategory: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ category: newCategory })
        .eq('id', docId);

      if (error) throw error;

      onShowToast('Category updated', 'success');
      await fetchDocuments();
    } catch (error) {
      logError('Category Update', error);
      onShowToast('Failed to update category', 'error');
    }
  };

  const handleDelete = async (doc: Document) => {
    const confirmed = await confirm(
      `Delete "${doc.file_name}"?`,
      { title: 'Delete Document', variant: 'danger' }
    );
    if (!confirmed) return;

    setDeleting(doc.id);

    try {
      console.log('Deleting document:', doc);

      if (doc.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('case-documents')
          .remove([doc.storage_path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        } else {
          console.log('Deleted from storage:', doc.storage_path);
        }
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) {
        logError('Database Delete', dbError);
        throw dbError;
      }

      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: `Document deleted: ${doc.file_name}`,
        timestamp: new Date().toISOString(),
        user_name: 'Admin'
      });

      onShowToast('Document deleted successfully', 'success');
      await fetchDocuments();
    } catch (error) {
      logError('Delete Document', error);
      onShowToast('Failed to delete document', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return documents.length;
    return documents.filter(doc => doc.category === category).length;
  };

  const getAllDocuments = () => {
    return [...documents, ...generatedDocuments];
  };

  return (
    <>
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Documents</h3>
        </div>
        <div className="p-4 sm:p-6">

        {/* Upload Area */}
        <div className="relative">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : uploading
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-700 font-medium">Uploading files...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG, JPEG (max 10MB per file)
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files);
                }
              }}
              className="hidden"
              disabled={uploading}
            />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {category} ({getCategoryCount(category)})
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No documents in this category'}
            </h3>
            <p className="text-gray-600 mb-4">
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try selecting a different category'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>{getFileIcon(doc.file_type)}</div>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === doc.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <h4 className="font-medium text-gray-900 truncate mb-2" title={doc.file_name}>
                  {doc.file_name}
                </h4>
                <select
                  value={doc.category}
                  onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded border border-gray-300 mb-2 cursor-pointer hover:border-gray-400 transition-colors ${getCategoryColor(doc.category)}`}
                >
                  <option value="Letters">Letters</option>
                  <option value="Medical">Medical</option>
                  <option value="Photos">Photos</option>
                  <option value="Court">Court</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-sm text-gray-500 mb-1">{formatFileSize(doc.file_size)}</p>
                <p className="text-xs text-gray-400 mb-3">{formatDate(doc.uploaded_at)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(doc)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewDocument && (
        <div className={`fixed inset-0 z-50 ${isPreviewFullscreen ? 'bg-black' : 'bg-black bg-opacity-50'}`}>
          <div className={`${isPreviewFullscreen ? 'h-full w-full' : 'h-5/6 w-5/6 mx-auto mt-8'} bg-white rounded-lg shadow-xl flex flex-col`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{previewDocument.file_name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(previewDocument.uploaded_at || previewDocument.generated_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{previewDocument.uploaded_by || previewDocument.generated_by}</span>
                    </div>
                    {'category' in previewDocument && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(previewDocument.category)}`}>
                          {previewDocument.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviewFullscreen}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isPreviewFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isPreviewFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleDownload(previewDocument)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePreviewClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 p-4">
              {isPdfDocument(previewDocument) ? (
                <iframe
                  src={previewDocument.file_url}
                  className="w-full h-full border-0 rounded"
                  title={previewDocument.file_name}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <button
                      onClick={() => handleDownload(previewDocument)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download to view
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    {ConfirmDialog}
    </>
  );
}
