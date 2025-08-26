<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { dataScopeOptions } from '@/constants/business';
import { fetchUpdateRoleDataScope } from '@/service/api/system/role';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'RoleDataScopeDrawer'
});

interface Props {
  /** the edit row data */
  rowData?: Api.System.Role | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule } = useFormRules();

const title = computed(() => '分配数据权限');

type Model = Api.System.RoleOperateParams;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    roleId: props.rowData?.roleId,
    roleName: props.rowData?.roleName,
    roleKey: props.rowData?.roleKey,
    roleSort: props.rowData?.roleSort,
    menuIds: [],
    dataScope: '1'
  };
}

type RuleKey = Extract<keyof Model, 'dataScope'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  dataScope: createRequiredRule('数据权限范围不能为空')
};

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { roleId, roleName, roleKey, roleSort, dataScope, menuIds } = model;

  const { error } = await fetchUpdateRoleDataScope({
    roleId,
    roleName,
    roleKey,
    roleSort,
    dataScope,
    menuIds
  });
  if (error) return;

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="800" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem label="角色名称" path="roleName">
          <NInput v-model:value="model.roleName" disabled placeholder="请输入角色名称" />
        </NFormItem>
        <NFormItem path="roleKey">
          <template #label>
            <div class="flex-center">
              <FormTip content="控制器中定义的权限字符，如：@SaCheckRole('admin')" />
              <span class="pl-3px">权限字符</span>
            </div>
          </template>
          <NInput v-model:value="model.roleKey" disabled placeholder="请输入权限字符" />
        </NFormItem>
        <NFormItem label="权限范围" path="dataScope">
          <NSelect v-model:value="model.dataScope" :options="dataScopeOptions" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
