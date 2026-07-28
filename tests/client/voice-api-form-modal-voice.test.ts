// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('naive-ui', () => ({
  useMessage: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
  NModal: defineComponent({
    name: 'NModal',
    inheritAttrs: false,
    props: { show: { type: Boolean, default: false } },
    template: '<div v-if="show"><slot /><slot name="footer" /></div>',
  }),
  NForm: defineComponent({
    name: 'NForm',
    inheritAttrs: false,
    template: '<form><slot /></form>',
  }),
  NFormItem: defineComponent({
    name: 'NFormItem',
    inheritAttrs: false,
    template: '<label><slot /></label>',
  }),
  NInput: defineComponent({
    name: 'NInput',
    inheritAttrs: false,
    props: { value: { type: String, default: '' } },
    emits: ['update:value', 'blur'],
    template: '<input v-bind="$attrs" :value="value" @input="$emit(\'update:value\', $event.target.value)" @blur="$emit(\'blur\')" />',
  }),
  NSelect: defineComponent({
    name: 'NSelect',
    inheritAttrs: false,
    props: {
      value: { type: [String, Number], default: null },
      options: { type: Array as () => Array<{ label: string, value: string }>, default: () => [] },
    },
    emits: ['update:value'],
    template: '<select v-bind="$attrs" :value="value" @change="$emit(\'update:value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
  }),
  NButton: defineComponent({
    name: 'NButton',
    inheritAttrs: false,
    template: '<button v-bind="$attrs"><slot /></button>',
  }),
}))

vi.mock('@/api/hermes/voice-provider-probe', () => ({
  probeVoiceProvider: vi.fn().mockResolvedValue({ ok: true, models: [], recommendedModel: '' }),
}))

import VoiceApiFormModal from '@/components/hermes/settings/voice/VoiceApiFormModal.vue'

const VOICE_INPUT = '[data-testid="voice-provider-voice-input"]'
const VOICE_SELECT = '[data-testid="voice-provider-voice"]'

function mountModal() {
  return mount(VoiceApiFormModal, { props: { kind: 'tts', show: true } })
}

async function selectPreset(wrapper: ReturnType<typeof mountModal>, presetId: string) {
  await wrapper.find('[data-testid="voice-provider-select"]').setValue(presetId)
}

describe('VoiceApiFormModal voice field', () => {
  it('hides the voice field until a preset is chosen', () => {
    const wrapper = mountModal()
    expect(wrapper.find(VOICE_INPUT).exists()).toBe(false)
    expect(wrapper.find(VOICE_SELECT).exists()).toBe(false)
  })

  it('renders a free-text voice input for custom TTS', async () => {
    const wrapper = mountModal()
    await selectPreset(wrapper, 'tts-custom')

    expect(wrapper.find(VOICE_INPUT).exists()).toBe(true)
    expect(wrapper.find(VOICE_SELECT).exists()).toBe(false)
  })

  it('includes the typed voice in the saved payload', async () => {
    const wrapper = mountModal()
    await selectPreset(wrapper, 'tts-custom')

    await wrapper.find('[data-testid="voice-provider-base-url"]').setValue('https://api.groq.com/openai/v1')
    await wrapper.find('[data-testid="voice-provider-api-key"]').setValue('test-key')
    wrapper.findComponent('[data-testid="voice-provider-model"]').vm.$emit('update:value', 'playai-tts')
    await nextTick()
    await wrapper.find(VOICE_INPUT).setValue('Fritz-PlayAI')

    await wrapper.find('[data-testid="voice-provider-save"]').trigger('click')

    const saved = wrapper.emitted('saved')
    expect(saved).toBeTruthy()
    const payload = saved![0][0] as { settings: Record<string, string> }
    expect(payload.settings.voice).toBe('Fritz-PlayAI')
    expect(payload.settings.model).toBe('playai-tts')
  })

  it('omits voice from the payload when left empty', async () => {
    const wrapper = mountModal()
    await selectPreset(wrapper, 'tts-custom')

    await wrapper.find('[data-testid="voice-provider-base-url"]').setValue('https://api.groq.com/openai/v1')
    await wrapper.find('[data-testid="voice-provider-api-key"]').setValue('test-key')
    wrapper.findComponent('[data-testid="voice-provider-model"]').vm.$emit('update:value', 'playai-tts')
    await nextTick()

    await wrapper.find('[data-testid="voice-provider-save"]').trigger('click')

    const saved = wrapper.emitted('saved')
    expect(saved).toBeTruthy()
    const payload = saved![0][0] as { settings: Record<string, string> }
    expect(payload.settings.voice).toBeUndefined()
  })

  it('keeps the Doubao voice picker instead of a free-text input', async () => {
    const wrapper = mountModal()
    await selectPreset(wrapper, 'tts-doubao')

    expect(wrapper.find(VOICE_SELECT).exists()).toBe(true)
    expect(wrapper.find(VOICE_INPUT).exists()).toBe(false)
  })
})
