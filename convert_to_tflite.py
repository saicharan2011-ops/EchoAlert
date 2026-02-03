
import tensorflow as tf
import tensorflow_hub as hub

# Load YAMNet from TF Hub
model = hub.load('https://tfhub.dev/google/yamnet/1')

# Wrap the specific function we need (frames -> embeddings)
# YAMNet's default signature takes a waveform and returns (scores, embeddings, log_mel_spectrogram)
# We need to ensure the TFLite model exports this.

class YAMNetWrapper(tf.Module):
    def __init__(self, model):
        self.model = model

    @tf.function(input_signature=[tf.TensorSpec(shape=[None], dtype=tf.float32)])
    def __call__(self, waveform):
        scores, embeddings, log_mel_spectrogram = self.model(waveform)
        return embeddings

wrapper = YAMNetWrapper(model)

# Convert to TFLite
converter = tf.lite.TFLiteConverter.from_concrete_functions([wrapper.__call__.get_concrete_function()])
tflite_model = converter.convert()

# Save
with open('yamnet.tflite', 'wb') as f:
    f.write(tflite_model)

print("✅ Success! 'yamnet.tflite' has been generated.")
print("Copy this file to your Raspberry Pi manually or via deployment script.")
