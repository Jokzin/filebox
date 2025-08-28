<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <h1 class="text-4xl font-bold text-center mb-8">Bernie la boîte</h1>

      <!-- Dropzone -->
      <div
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        :class="{ 'border-green-500 bg-gray-700': isDragging }"
        class="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-gray-700 transition-colors"
      >
        <p class="text-lg">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
        <input ref="fileInput" type="file" multiple @change="handleFileSelect" class="hidden" :disabled="isUploading" />
        <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
      </div>

      <!-- File List -->
      <div v-if="files.length > 0" class="mt-6">
        <h2 class="text-xl font-semibold mb-2">Fichiers sélectionnés :</h2>
        <ul>
          <li 
            v-for="fileWrapper in files" 
            :key="fileWrapper.id" 
            class="flex justify-between items-center bg-gray-800 p-2 rounded-md mb-2 transition-all duration-300"
            :style="{ background: getBackground(fileWrapper) }"
          >
            <span class="truncate pr-4">{{ fileWrapper.file.name }}</span>
            <div class="flex items-center">
              <span v-if="fileWrapper.status === 'uploading'" class="text-sm text-gray-400">{{ fileWrapper.progress }}%</span>
              <span v-if="fileWrapper.status === 'success'" class="text-green-500">✓</span>
              <span v-if="fileWrapper.status === 'error'" class="text-red-500" title="Erreur">✗</span>
              <button @click="removeFile(fileWrapper.id)" class="ml-4 text-red-500 hover:text-red-400 disabled:opacity-50" :disabled="isUploading">
                &times;
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Upload Button -->
      <div class="mt-6 text-center">
        <button
          @click="createBox"
          :disabled="files.length === 0 || isUploading"
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          <span v-if="isUploading">Création en cours...</span>
          <span v-else>Créer la Box</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { navigateTo } from '#app';
import { nanoid } from 'nanoid';

const files = ref([]);
const fileInput = ref(null);
const error = ref('');
const isDragging = ref(false);

const isUploading = computed(() => files.value.some(f => f.status === 'uploading' || f.status === 'processing'));

const triggerFileInput = () => {
  if (isUploading.value) return;
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  addFiles(event.target.files);
};

const handleDrop = (event) => {
  isDragging.value = false;
  addFiles(event.dataTransfer.files);
};

const handleDragOver = (event) => {
  isDragging.value = true;
};

const handleDragLeave = (event) => {
  isDragging.value = false;
};

const addFiles = (fileList) => {
  error.value = '';
  for (const file of fileList) {
    files.value.push({
      id: nanoid(),
      file: file,
      progress: 0,
      status: 'pending', // 'pending', 'uploading', 'success', 'error', 'processing'
    });
  }
};

const removeFile = (id) => {
  const index = files.value.findIndex(f => f.id === id);
  if (index > -1) {
    files.value.splice(index, 1);
  }
};

const getBackground = (fileWrapper) => {
  if (fileWrapper.status === 'uploading') {
    return `linear-gradient(to right, #2d573d ${fileWrapper.progress}%, #374151 ${fileWrapper.progress}%)`;
  }
  if (fileWrapper.status === 'success' || fileWrapper.status === 'processing') {
    return '#2d573d'; // Green background for success
  }
  if (fileWrapper.status === 'error') {
    return '#572d2d'; // Red background for error
  }
  return '#374151'; // Default background
};

const uploadFileToCloudinary = (fileWrapper, boxId) => {
  return new Promise((resolve, reject) => {
    fileWrapper.status = 'uploading';
    
    const formData = new FormData();
    formData.append('file', fileWrapper.file);
    formData.append('upload_preset', 'bernie_box_preset');
    formData.append('cloud_name', 'dmmqarhea');
    formData.append('tags', boxId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/dmmqarhea/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        fileWrapper.progress = Math.round((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data.error) {
          fileWrapper.status = 'error';
          reject(new Error(data.error.message));
        } else {
          fileWrapper.status = 'success';
          fileWrapper.progress = 100;
          resolve({ public_id: data.public_id, secure_url: data.secure_url });
        }
      } else {
        fileWrapper.status = 'error';
        reject(new Error(`Échec de l'upload: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      fileWrapper.status = 'error';
      reject(new Error("Erreur réseau lors de l'upload."));
    };

    xhr.send(formData);
  });
};

const createBox = async () => {
  if (files.value.length === 0) {
    error.value = 'Veuillez sélectionner au moins un fichier.';
    return;
  }
  error.value = '';

  const boxId = nanoid(10);
  const uploadPromises = files.value.map(fw => uploadFileToCloudinary(fw, boxId));

  try {
    const uploadedFilesData = await Promise.all(uploadPromises);
    
    // All files are uploaded, now create the box entry
    files.value.forEach(fw => fw.status = 'processing');

    const { data, error: fetchError } = await useFetch('/api/box', {
      method: 'POST',
      body: { boxId: boxId, files: uploadedFilesData },
    });

    if (fetchError.value) {
      throw new Error(fetchError.value.data?.message || 'Une erreur est survenue lors de la création de la box.');
    }

    if (data.value?.success && data.value?.boxId) {
      await navigateTo(`/box/${data.value.boxId}`);
    } else {
      throw new Error('La création de la box a échoué.');
    }
  } catch (e) {
    error.value = e.message;
    // It's good to also mark any non- errored files as errored if the overall process fails
    files.value.forEach(fw => {
      if (fw.status !== 'success') {
        fw.status = 'error';
      }
    });
  }
};
</script>
