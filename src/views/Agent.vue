<template>
  <div class="home">
    <div class="grid grid-cols-12">
      <div class="col-span-2 text-left p-2">
        <div v-for="(agentName, k) in Object.keys(agents)" :key="k">
          <div v-if="k === selectedAgentKey" class="font-bold cursor-pointer break-words">
            {{ agentName }}
          </div>
          <div
            v-else
            class="cursor-pointer break-words"
            @click="
              selectedAgentKey = k;
              selectedSampleKey = 0;
            "
          >
            {{ agentName }}
          </div>
        </div>
      </div>

      <div class="col-span-8">
        <h2 class="text-xl">{{ selectedAgent["name"] }}</h2>
        <div class="text-left">{{ selectedAgent["description"] }}</div>
        <div v-for="(v, k) in selectedAgent['samples']" :key="k" class="text-left">
          <div @click="selectedSampleKey = k">
            <div :class="k === selectedSampleKey ? 'font-bold' : ''">sample {{ k }}</div>
            <div>
              <div>inputs: {{ v["inputs"] }}</div>
              <div>params: {{ v["params"] }}</div>
              <div>result: {{ v["result"] }}</div>
              <hr />
            </div>
          </div>
        </div>
        <!-- [ "name", "agent", "mock", "inputs", "output", "params", "samples", "description", "category", "author", "repository", "cacheType", "license" ] -->
        <div>
          <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="run">Run</button>
        </div>
        <div>
          <button class="text-white font-bold items-center rounded-full px-4 py-2 m-1 bg-sky-500 hover:bg-sky-700" @click="load">Load</button>
        </div>
        <div class="text-left">
          Inputs(JSON format):
          <textarea class="border-2 w-full" :class="validInputs ? '' : 'border-4 border-red-700'" v-model="inputsText"></textarea>
        </div>
        <div class="text-left">
          Params(JSON format):
          <textarea class="border-2 w-full" :class="validParams ? '' : 'border-4 border-red-700'" v-model="paramsText"></textarea>
        </div>
        <div class="text-left">
          Result:
          <textarea class="border-2 w-full">{{ resultText }}</textarea>
        </div>
      </div>
    </div>

    <div class="mt-2">
      <div class="w-10/12 m-auto text-left">
        <div v-for="(m, k) in messages" :key="k">
          <div v-if="m.role === 'user'" class="mr-8">👱{{ m.content }}</div>
          <div class="ml-20" v-else>🤖{{ m.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defaultTestContext } from "graphai";
import { defineComponent, ref, computed } from "vue";
import * as agents from "@graphai/vanilla";

export default defineComponent({
  name: "HomePage",
  components: {},
  setup() {
    const selectedAgentKey = ref(0);
    const selectedAgent = computed(() => {
      return Object.values(agents)[selectedAgentKey.value];
    });

    const selectedSampleKey = ref(0);
    const selectedSample = computed(() => {
      return selectedAgent.value.samples[selectedSampleKey.value];
    });

    const inputsText = ref("");
    const paramsText = ref("");
    const resultText = ref("");

    const messages = ref<{ role: string; content: string }[]>([]);

    const userInput = ref("");

    const inputPromise = ref<((message: string) => void)[]>([]);
    const submit = () => {
      if (inputPromise.value.length > 0) {
        const task = inputPromise.value.shift();
        if (task) {
          task(userInput.value);
          userInput.value = "";
        }
      }
    };

    const load = () => {
      // const agent = selectedAgent.value.agent;
      const { inputs, params } = selectedSample.value;
      // console.log(inputs, params);

      inputsText.value = JSON.stringify(inputs);
      paramsText.value = JSON.stringify(params);
    };

    const validInputs = computed(() => {
      try {
        console.log(inputsText);
        JSON.parse(inputsText.value);
        return true;
      } catch (__error) {
        return false;
      }
    });
    const validParams = computed(() => {
      try {
        JSON.parse(paramsText.value);
        return true;
      } catch (__error) {
        return false;
      }
    });

    const run = async () => {
      if (!validInputs.value || !validParams.value) {
        return;
      }

      const agent = selectedAgent.value.agent;
      const result = await agent({ ...defaultTestContext, namedInputs: JSON.parse(inputsText.value), params: JSON.parse(paramsText.value) });
      resultText.value = JSON.stringify(result);
    };

    return {
      selectedAgentKey,
      selectedAgent,

      selectedSampleKey,
      resultText,
      inputsText,
      paramsText,

      validInputs,
      validParams,

      run,
      load,

      submit,
      userInput,
      messages,
      inputPromise,

      agents,
    };
  },
});
</script>
