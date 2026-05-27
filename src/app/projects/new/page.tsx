'use client';

import React, {
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { createProject } from '@/lib/actions';
import {
  Upload,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Ruler,
  DollarSign,
  FileText,
  Type,
} from 'lucide-react';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

interface FormErrors {
  title?: string;
  description?: string;
  dimensions?: string;
  priceMin?: string;
  priceMax?: string;
  image?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read file as string'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

export default function NewProjectPage() {
  const router = useRouter();
  const { currentUserRole } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setGlobalError(null);
    setErrors(prev => ({ ...prev, image: undefined }));

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        image: 'Please upload a valid image (JPEG, PNG, WebP, or GIF).',
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors(prev => ({
        ...prev,
        image: `Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`,
      }));
      return;
    }

    setIsProcessingImage(true);
    try {
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
      setImageFileName(file.name);
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, image: 'Failed to read image file.' }));
    } finally {
      setIsProcessingImage(false);
    }
  }, []);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const removeImage = () => {
    setImageBase64(null);
    setImageFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Please give your project a title.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title should be at least 5 characters.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please describe what you want built.';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description should be at least 20 characters.';
    }

    if (!dimensions.trim()) {
      newErrors.dimensions = 'Please specify the dimensions.';
    }

    const minNum = parseFloat(priceMin);
    const maxNum = parseFloat(priceMax);

    if (!priceMin.trim() || isNaN(minNum) || minNum < 0) {
      newErrors.priceMin = 'Enter a valid minimum price.';
    }
    if (!priceMax.trim() || isNaN(maxNum) || maxNum < 0) {
      newErrors.priceMax = 'Enter a valid maximum price.';
    }
    if (!newErrors.priceMin && !newErrors.priceMax && minNum > maxNum) {
      newErrors.priceMax = 'Maximum must be greater than or equal to minimum.';
    }

    if (!imageBase64) {
      newErrors.image = 'Please upload a reference image.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validate()) {
      setGlobalError('Please fix the errors below before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProject({
        title: title.trim(),
        description: description.trim(),
        dimensions: dimensions.trim(),
        priceMin: parseFloat(priceMin),
        priceMax: parseFloat(priceMax),
        customerId: 'customer_self',
        image: imageBase64!,
      });

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
      setGlobalError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  if (currentUserRole !== 'customer') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-amber-200 rounded-2xl p-10 text-center shadow-sm">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            Customer Access Only
          </h2>
          <p className="text-stone-600 mb-6 max-w-md mx-auto">
            Only customers can post new furniture projects. Switch to the
            Customer role from the navigation bar to continue.
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link
        href="/"
        className="inline-flex items-center space-x-1 text-stone-600 hover:text-amber-800 text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Marketplace</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight mb-2">
          Post a New Project
        </h1>
        <p className="text-stone-600">
          Share your custom furniture vision. Skilled artisans will submit bids
          for you to review.
        </p>
      </div>

      {globalError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{globalError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <label className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-3">
            <ImageIcon className="h-4 w-4 text-amber-700" />
            <span>Reference Image *</span>
          </label>

          {imageBase64 ? (
            <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageBase64}
                alt="Project reference"
                className="w-full max-h-96 object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm hover:bg-red-50 text-stone-700 hover:text-red-700 p-2 rounded-full shadow-md transition-colors"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              {imageFileName && (
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-stone-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="truncate max-w-xs">{imageFileName}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50'
                  : errors.image
                  ? 'border-red-300 bg-red-50/50 hover:border-red-400'
                  : 'border-stone-300 bg-stone-50/50 hover:border-amber-400 hover:bg-amber-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
              {isProcessingImage ? (
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-10 w-10 text-amber-700 animate-spin" />
                  <p className="text-sm text-stone-600">Processing image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-amber-100 p-3 rounded-full">
                    <Upload className="h-6 w-6 text-amber-800" />
                  </div>
                  <div>
                    <p className="text-stone-900 font-semibold mb-1">
                      Drop an image here, or click to browse
                    </p>
                    <p className="text-xs text-stone-500">
                      JPEG, PNG, WebP, or GIF · Max {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {errors.image && (
            <p className="mt-2 text-sm text-red-700 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.image}</span>
            </p>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <label
              htmlFor="title"
              className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-2"
            >
              <Type className="h-4 w-4 text-amber-700" />
              <span>Project Title *</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Custom Walnut Dining Table"
              maxLength={120}
              className={`w-full px-4 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition ${
                errors.title ? 'border-red-300' : 'border-stone-200'
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-sm text-red-700">{errors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-2"
            >
              <FileText className="h-4 w-4 text-amber-700" />
              <span>Description *</span>
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the piece you want built — materials, finish, style, intended use, and any special details..."
              maxLength={2000}
              className={`w-full px-4 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-y ${
                errors.description ? 'border-red-300' : 'border-stone-200'
              }`}
            />
            <div className="mt-1 flex justify-between items-center">
              {errors.description ? (
                <p className="text-sm text-red-700">{errors.description}</p>
              ) : (
                <span className="text-xs text-stone-400">
                  Be as specific as possible to attract the right artisans.
                </span>
              )}
              <span className="text-xs text-stone-400">
                {description.length}/2000
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="dimensions"
              className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-2"
            >
              <Ruler className="h-4 w-4 text-amber-700" />
              <span>Dimensions *</span>
            </label>
            <input
              id="dimensions"
              type="text"
              value={dimensions}
              onChange={e => setDimensions(e.target.value)}
              placeholder="e.g. 180cm x 90cm x 75cm (L x W x H)"
              maxLength={200}
              className={`w-full px-4 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition ${
                errors.dimensions ? 'border-red-300' : 'border-stone-200'
              }`}
            />
            {errors.dimensions && (
              <p className="mt-1.5 text-sm text-red-700">{errors.dimensions}</p>
            )}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-stone-900 mb-2">
              <DollarSign className="h-4 w-4 text-amber-700" />
              <span>Budget Range (USD) *</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    placeholder="Min"
                    className={`w-full pl-7 pr-3 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition ${
                      errors.priceMin ? 'border-red-300' : 'border-stone-200'
                    }`}
                  />
                </div>
                {errors.priceMin && (
                  <p className="mt-1.5 text-xs text-red-700">{errors.priceMin}</p>
                )}
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    placeholder="Max"
                    className={`w-full pl-7 pr-3 py-2.5 bg-stone-50 border rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition ${
                      errors.priceMax ? 'border-red-300' : 'border-stone-200'
                    }`}
                  />
                </div>
                {errors.priceMax && (
                  <p className="mt-1.5 text-xs text-red-700">{errors.priceMax}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium text-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isProcessingImage}
            className="inline-flex items-center justify-center space-x-2 bg-amber-800 hover:bg-amber-900 disabled:bg-amber-800/60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Posting Project...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Post Project</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
