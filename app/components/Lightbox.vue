<template>
  <div 
    class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')" 
  >
    <div class="relative max-w-4xl max-h-full w-full">
      <img 
        v-if="type === 'image'"
        :src="url" 
        alt="Prévisualisation" 
        class="max-w-full max-h-[90vh] object-contain mx-auto" 
      />
      <video 
        v-else-if="type === 'video'"
        :src="url"
        controls
        autoplay
        class="max-w-full max-h-[90vh] object-contain mx-auto"
      >
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
      <button 
        @click="$emit('close')"
        class="absolute -top-4 -right-4 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center text-2xl font-bold leading-none"
      >
        &times;
      </button>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ['image', 'video'].includes(value),
    }
  });

  defineEmits(['close']);
</script>