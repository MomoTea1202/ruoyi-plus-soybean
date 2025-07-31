<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useLoading } from '@sa/hooks';
import { fetchCreateUser, fetchGetUserInfo, fetchUpdateUser } from '@/service/api/system/sub-acc-user';
import { fetchSubAccPermMenuTreeSelect } from '@/service/api/system';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import MenuTree from '@/components/custom/menu-tree.vue';
import { $t } from '@/locales';

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
const { startLoading: startDeptLoading, endLoading: endDeptLoading } = useLoading();
const { loading: menuLoading } = useLoading();
const { formRef, validate, restoreValidation } = useNaiveForm();
const { createRequiredRule, patternRules } = useFormRules();
const menuTreeRef = ref<InstanceType<typeof MenuTree> | null>(null);
const menuOptions = ref<Api.System.MenuList>([]);

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.system.user.addUser'),
    edit: $t('page.system.user.editUser')
  };
  return titles[props.operateType];
});

type Model = Api.System.UserOperateParams;

const model: Model = reactive(createDefaultModel());

async function loadMenuTree(userName?: string) {
  menuLoading.value = true;
  try {
    const { error, data } = await fetchSubAccPermMenuTreeSelect(userName!);
    if (!error) {
      // full tree data
      menuOptions.value = data.menus;
      // pre‑check on edit
      if (props.operateType === 'edit') {
        model.menuIds = data.checkedKeys;
      }
    }
  } finally {
    menuLoading.value = false;
  }
}

function createDefaultModel(): Model {
  return {
    deptId: null,
    userName: '',
    nickName: '',
    email: '',
    phonenumber: '',
    sex: '0',
    password: '',
    status: '0',
    roleIds: [],
    postIds: [],
    remark: '',
    menuIds: []
  };
}

type RuleKey = Extract<keyof Model, 'userName' | 'nickName' | 'password' | 'status' | 'phonenumber' | 'email'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  userName: [createRequiredRule($t('page.system.user.form.userName.required'))],
  nickName: [createRequiredRule($t('page.system.user.form.nickName.required'))],
  password: [{ ...patternRules.pwd, required: props.operateType === 'add' }],
  phonenumber: [patternRules.phone],
  status: [createRequiredRule($t('page.system.user.form.status.required'))],
  email: [createRequiredRule($t('page.system.user.form.email.required'))]
};

async function getUserInfo() {
  startLoading();
  const { error, data } = await fetchGetUserInfo(props.rowData?.userId);
  if (!error) {
    model.roleIds = data.roleIds;
    model.postIds = data.postIds;
  }
  endLoading();
}

async function handleUpdateModelWhenEdit() {
  menuOptions.value = [];
  model.menuIds = [];
  if (props.operateType === 'add') {
    menuTreeRef.value?.refresh();
    Object.assign(model, createDefaultModel());
    return;
  }

  if (props.operateType === 'edit' && props.rowData) {
    startDeptLoading();
    Object.assign(model, props.rowData);
    const { data, error } = await fetchSubAccPermMenuTreeSelect(model.userName!);
    if (error) return;
    model.menuIds = data.checkedKeys;
    menuOptions.value = data.menus;
    model.password = '';
    getUserInfo();
    loadMenuTree(props.rowData.userName);
    endDeptLoading();
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const { userId, deptId, userName, nickName, email, phonenumber, sex, password, status, roleIds, postIds, remark } =
    model;
  const menuIds = menuTreeRef.value?.getCheckedMenuIds();

  // request
  if (props.operateType === 'add') {
    const { error } = await fetchCreateUser({
      deptId,
      userName,
      password,
      nickName,
      email,
      phonenumber,
      sex,
      status,
      roleIds,
      postIds,
      remark,
      menuIds
    });
    if (error) return;
  }

  if (props.operateType === 'edit') {
    const { error } = await fetchUpdateUser({
      userId,
      deptId,
      userName,
      nickName,
      email,
      phonenumber,
      sex,
      status,
      roleIds,
      postIds,
      remark,
      menuIds
    });
    if (error) return;
  }

  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, async show => {
  if (show) {
    handleUpdateModelWhenEdit();
    if (props.operateType === 'edit' && props.rowData) {
      await handleUpdateModelWhenEdit();
      await loadMenuTree(props.rowData.userName);
    } else {
      menuTreeRef.value?.refresh();
    }
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
          <NFormItem :label="$t('page.system.user.status')" path="status">
            <DictRadio v-model:value="model.status" dict-code="sys_normal_disable" />
          </NFormItem>
          <NFormItem label="菜单权限" path="menuIds" class="pr-24px">
            <MenuTree
              v-if="visible"
              ref="menuTreeRef"
              v-model:checked-keys="model.menuIds"
              v-model:options="menuOptions"
              v-model:loading="menuLoading"
              :immediate="operateType === 'add'"
            />
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
