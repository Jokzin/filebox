<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <h1 class="text-4xl font-bold text-center mb-8">Bernie la boîte</h1>

      <!-- Dropzone -->
      <div
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleDrop"
        class="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-gray-700 transition-colors"
      >
        <p class="text-lg">Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
        <input ref="fileInput" type="file" multiple @change="handleFileSelect" class="hidden" />
        <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
      </div>

      <!-- File List -->
      <div v-if="files.length > 0" class="mt-6">
        <h2 class="text-xl font-semibold mb-2">Fichiers sélectionnés :</h2>
        <ul>
          <li v-for="(file, index) in files" :key="index" class="flex justify-between items-center bg-gray-800 p-2 rounded-md mb-2">
            <span>{{ file.name }}</span>
            <button @click="removeFile(index)" class="text-red-500 hover:text-red-400">
              &times;
            </button>
          </li>
        </ul>
      </div>

      <!-- Upload Button -->
      <div class="mt-6 text-center">
        <button
          @click="createBox"
          :disabled="files.length === 0 || loading"
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Création en cours...</span>
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
const loading = ref(false);
const error = ref('');

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  addFiles(event.target.files);
};

const handleDrop = (event) => {
  addFiles(event.dataTransfer.files);
};

const addFiles = (fileList) => {
  error.value = '';
  for (const file of fileList) {
    files.value.push(file);
  }
};

const removeFile = (index) => {
  files.value.splice(index, 1);
};

const uploadFileToCloudinary = async (file, boxId) => { // Accept boxId
  const cloudinaryFormData = new FormData();
  cloudinaryFormData.append('file', file);
  cloudinaryFormData.append('upload_preset', 'bernie_box_preset');
  cloudinaryFormData.append('cloud_name', 'dmmqarhea');
  cloudinaryFormData.append('tags', boxId); // Add boxId as a tag

  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/dmmqarhea/upload', {
      method: 'POST',
      body: cloudinaryFormData,
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return { public_id: data.public_id, secure_url: data.secure_url };
  } catch (e) {
    console.error('Cloudinary upload error:', e);
    throw new Error(`Échec de l'upload vers Cloudinary pour ${file.name}: ${e.message}`);
  }
};

const createBox = async () => {
  if (files.value.length === 0) {
    error.value = 'Veuillez sélectionner au moins un fichier.';
    return;
  }

  loading.value = true;
  error.value = '';

  const boxId = nanoid(10); // Generate boxId here
  const uploadedFilesData = [];
  try {
    for (const file of files.value) {
      const result = await uploadFileToCloudinary(file, boxId); // Pass boxId
      uploadedFilesData.push(result);
    }

    const { data, error: fetchError } = await useFetch('/api/box', {
      method: 'POST',
      body: { boxId: boxId, files: uploadedFilesData }, // Send boxId and Cloudinary data
    });

    if (fetchError.value) {
      throw new Error(fetchError.value.data?.message || 'Une erreur est survenue.');
    }

    if (data.value?.success && data.value?.boxId) {
      await navigateTo(`/box/${data.value.boxId}`);
    } else {
      throw new Error('La création de la box a échoué.');
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>
