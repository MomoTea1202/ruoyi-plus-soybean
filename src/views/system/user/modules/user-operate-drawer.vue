<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import { fetchCreateUser, fetchGetUserInfo, fetchUpdateUser } from '@/service/api/system';
import { useAuthStore } from '@/store/modules/auth';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';
import CompanySelect from './cpy-select.vue';

defineOptions({
  name: 'UserOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: Api.System.User | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { loading, startLoading, endLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule, patternRules } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.system.user.addUser'),
    edit: $t('page.system.user.editUser')
  };
  return titles[props.operateType];
});

type Model = Api.System.UserOperateParams;

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    userName: '',
    nickName: '',
    email: '',
    phonenumber: '',
    sex: '0',
    password: '',
    status: '0',
    roleKey: '',
    remark: '',
    menuIds: [],
    cpyId: ''
  };
}
const auth = useAuthStore();
const isSA = computed(() => auth.isSa);
const showCompany = ref(false);

watch(
  [() => model.roleKey, isSA],
  ([rid, sa]) => {
    const ridNum = rid;
    const need = sa && (ridNum === 'MER' || ridNum === 'LDR');
    showCompany.value = need;
    if (!need) model.cpyId = '';
  },
  { immediate: true }
);

type RuleKey = Extract<
  keyof Model,
  'userName' | 'nickName' | 'password' | 'status' | 'phonenumber' | 'roleKey' | 'email' | 'cpyId'
>;

const rules = computed<Record<RuleKey, App.Global.FormRule[]>>(() => ({
  userName: [createRequiredRule($t('page.system.user.form.userName.required'))],
  nickName: [createRequiredRule($t('page.system.user.form.nickName.required'))],
  roleKey: [createRequiredRule('role id is require')],
  password: [{ ...patternRules.pwd, required: props.operateType === 'add' }],
  phonenumber: [patternRules.phone],
  status: [createRequiredRule($t('page.system.user.form.status.required'))],
  email: [createRequiredRule($t('page.system.user.form.email.required'))],
  cpyId: showCompany.value ? [createRequiredRule($t('page.system.user.form.company.required'))] : []
}));

async function getUserInfo() {
  startLoading();
  const { error, data } = await fetchGetUserInfo(props.rowData?.userId);
  if (!error) {
    model.roleKey = data.roleKey;
  }
  endLoading();
}

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel());
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, props.rowData);
    model.password = '';
    getUserInfo();
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { userId, userName, nickName, email, phonenumber, sex, password, status, roleKey, remark, menuIds, cpyId } =
    model;

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateUser({
      userName,
      password,
      nickName,
      email,
      phonenumber,
      sex,
      status,
      roleKey,
      remark,
      menuIds,
      cpyId
    });
    if (error) return;
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateUser({
      userId,
      userName,
      nickName,
      email,
      phonenumber,
      sex,
      status,
      roleKey,
      remark,
      menuIds,
      cpyId
    });
    if (error) return;
  }

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit();
    restoreValidation();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="800" class="max-w-90%">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NSpin :show="loading">
        <NForm ref="formRef" :model="model" :rules="rules">
          <NFormItem :label="$t('page.system.user.nickName')" path="nickName">
            <NInput v-model:value="model.nickName" :placeholder="$t('page.system.user.form.nickName.required')" />
          </NFormItem>
          <NFormItem :label="$t('page.system.user.phonenumber')" path="phonenumber">
            <NInput v-model:value="model.phonenumber" :placeholder="$t('page.system.user.form.phonenumber.required')" />
          </NFormItem>
          <NFormItem :label="$t('page.system.user.email')" path="email">
            <NInput v-model:value="model.email" :placeholder="$t('page.system.user.form.email.required')" />
          </NFormItem>
          <NFormItem v-if="operateType === 'add'" :label="$t('page.system.user.userName')" path="userName">
            <NInput v-model:value="model.userName" :placeholder="$t('page.system.user.form.userName.required')" />
          </NFormItem>
          <NFormItem v-if="operateType === 'add'" :label="$t('page.system.user.password')" path="password">
            <NInput
              v-model:value="model.password"
              type="password"
              show-password-on="click"
              :input-props="{ autocomplete: 'off' }"
              :placeholder="$t('page.system.user.form.password.required')"
            />
          </NFormItem>
          <NFormItem :label="$t('page.system.user.sex')" path="sex">
            <DictRadio
              v-model:value="model.sex"
              dict-code="sys_user_sex"
              :placeholder="$t('page.system.user.form.sex.required')"
            />
          </NFormItem>
          <NFormItem v-if="operateType === 'add'" :label="$t('page.system.user.roleKey')" path="roleKey">
            <RoleSelect v-model:value="model.roleKey" clearable :multiple="false" />
          </NFormItem>
          <NFormItem v-if="showCompany" :label="$t('page.system.user.company')" path="cpyId">
            <CompanySelect v-model:value="model.cpyId" clearable :multiple="false" />
          </NFormItem>
          <NFormItem :label="$t('page.system.user.status')" path="status">
            <DictRadio v-model:value="model.status" dict-code="sys_normal_disable" />
          </NFormItem>
          <NFormItem :label="$t('page.system.user.remark')" path="remark">
            <NInput v-model:value="model.remark" :placeholder="$t('page.system.user.form.remark.required')" />
          </NFormItem>
        </NForm>
      </NSpin>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
