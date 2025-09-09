<script setup lang="ts">
import { ref, useAttrs } from 'vue';
import type { SelectProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { fetchGetCompanySelect } from '@/service/api/system';

defineOptions({
  name: 'CompanySelect'
});

interface Props {
  [key: string]: any;
}

defineProps<Props>();

const value = defineModel<CommonType.IdType | null>('value', { required: false });

const attrs: SelectProps = useAttrs();

const { loading: companyLoading, startLoading: startCompanyLoading, endLoading: endCompanyLoading } = useLoading();

const companyOptions = ref<CommonType.Option<CommonType.IdType>[]>([]);

async function getCompanyOptions() {
  startCompanyLoading();
  const { error, data } = await fetchGetCompanySelect();

  if (!error) {
    companyOptions.value = data.map(item => ({
      label: item.userName,
      value: item.userId
    }));
  }
  endCompanyLoading();
}

getCompanyOptions();
</script>

<template>
  <NSelect
    v-model:value="value"
    :loading="companyLoading"
    :options="companyOptions"
    v-bind="attrs"
    placeholder="$t('page.system.user.form.remark.required')"
  />
</template>

<style scoped></style>
