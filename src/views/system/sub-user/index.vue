<script setup lang="tsx">
import { ref } from 'vue';
import { NDivider } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { jsonClone } from '@sa/utils';
import { fetchBatchDeleteUser, fetchGetSubUserList, fetchUpdateUserStatus } from '@/service/api/system/sub-acc-user';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { useDict } from '@/hooks/business/dict';
import { useAuth } from '@/hooks/business/auth';
import ButtonIcon from '@/components/custom/button-icon.vue';
import { $t } from '@/locales';
import StatusSwitch from '@/components/custom/status-switch.vue';
import UserOperateDrawer from './modules/user-operate-drawer.vue';
import UserPasswordDrawer from './modules/user-password-drawer.vue';
import UserSearch from './modules/user-search.vue';

defineOptions({
  name: 'SubUserList'
});

useDict('sys_user_sex');
useDict('sys_normal_disable');

const { hasAuth } = useAuth();
const appStore = useAppStore();

const { bool: passwordVisible, setTrue: openPasswordDrawer } = useBoolean();

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchGetSubUserList,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
    orderByColumn: null,
    isAsc: null,
    params: {
      // if you want to use the searchParams in Form, you need to define the following properties, and the value is null
      // the value can not be undefined, otherwise the property in Form will not be reactive
      deptId: null,
      userName: null,
      nickName: null,
      phonenumber: null,
      status: null
    }
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64
    },
    {
      key: 'userName',
      property: 'user_name',
      title: $t('page.system.user.userName'),
      align: 'center',
      minWidth: 120,
      ellipsis: true,
      sorter: true
    },
    {
      key: 'nickName',
      property: 'nick_name',
      title: $t('page.system.user.nickName'),
      align: 'center',
      minWidth: 120,
      ellipsis: true,
      sorter: true
    },
    {
      key: 'deptName',
      property: 'dept_name',
      title: $t('page.system.user.deptName'),
      align: 'center',
      minWidth: 120,
      ellipsis: true,
      sorter: true
    },
    {
      key: 'phonenumber',
      property: 'phonenumber',
      title: $t('page.system.user.phonenumber'),
      align: 'center',
      minWidth: 120,
      ellipsis: true,
      sorter: true
    },
    {
      key: 'status',
      property: 'status',
      title: $t('page.system.user.status'),
      align: 'center',
      minWidth: 80,
      render(row) {
        return (
          <StatusSwitch
            v-model:value={row.status}
            disabled={row.userId === 1}
            info={row.userName}
            onSubmitted={(value, callback) => handleStatusChange(row, value, callback)}
          />
        );
      },
      sorter: true
    },
    {
      key: 'createTime',
      property: 'create_time',
      title: $t('page.system.user.createTime'),
      align: 'center',
      minWidth: 120,
      sorter: true
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 150,
      render: row => {
        if (row.userId === 1) return null;

        const editBtn = () => {
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:drive-file-rename-outline-outline"
              tooltipContent={$t('common.edit')}
              onClick={() => edit(row.userId!)}
            />
          );
        };

        const passwordBtn = () => {
          return (
            <ButtonIcon
              text
              type="primary"
              icon="material-symbols:key-vertical-outline"
              tooltipContent="重置密码"
              onClick={() => handleResetPwd(row.userId!)}
            />
          );
        };

        const deleteBtn = () => {
          return (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:delete-outline"
              tooltipContent={$t('common.delete')}
              popconfirmContent={$t('common.confirmDelete')}
              onPositiveClick={() => handleDelete(row.userId!)}
            />
          );
        };

        const buttons = [];
        if (hasAuth('system:user:edit')) buttons.push(editBtn());
        if (hasAuth('system:user:resetPwd')) buttons.push(passwordBtn());
        if (hasAuth('system:user:remove')) buttons.push(deleteBtn());

        return (
          <div class="flex-center gap-8px">
            {buttons.map((btn, index) => (
              <>
                {index !== 0 && <NDivider vertical />}
                {btn}
              </>
            ))}
          </div>
        );
      }
    }
  ]
});

function handleSortChange(sorter: { columnKey: string; order: 'ascend' | 'descend' | false }) {
  const column = columns.value.find(col => (col as any)?.key === sorter.columnKey);
  const sortKey = (column as any)?.property ?? sorter.columnKey;

  if (sorter.order) {
    searchParams.orderByColumn = sortKey;
    searchParams.isAsc = sorter.order === 'ascend' ? 'asc' : 'desc';
  } else {
    searchParams.orderByColumn = null;
    searchParams.isAsc = null;
  }

  getDataByPage(searchParams.pageNum ?? 1);
}

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, getData);

async function handleBatchDelete() {
  // request
  const { error } = await fetchBatchDeleteUser(checkedRowKeys.value);
  if (error) return;
  onBatchDeleted();
}

async function handleDelete(userId: CommonType.IdType) {
  // request
  const { error } = await fetchBatchDeleteUser([userId]);
  if (error) return;
  onDeleted();
}

async function edit(userId: CommonType.IdType) {
  handleEdit('userId', userId);
}

async function handleResetPwd(userId: CommonType.IdType) {
  const findItem = data.value.find(item => item.userId === userId) || null;
  editingData.value = jsonClone(findItem);
  openPasswordDrawer();
}

const deptData = ref<Api.Common.CommonTreeRecord>([]);
const selectedKeys = ref<string[]>([]);

/** 处理状态切换 */
async function handleStatusChange(
  row: Api.System.User,
  value: Api.Common.EnableStatus,
  callback: (flag: boolean) => void
) {
  const { error } = await fetchUpdateUserStatus({
    userId: row.userId,
    status: value
  });

  callback(!error);

  if (!error) {
    window.$message?.success($t('page.system.user.statusChangeSuccess'));
    getData();
  }
}

function handleResetSearch() {
  resetSearchParams();
  selectedKeys.value = [];
}
</script>

<template>
  <div class="h-full flex-col-stretch gap-12px overflow-hidden lt-sm:overflow-auto">
    <UserSearch v-model:model="searchParams" @reset="handleResetSearch" @search="getDataByPage" />
    <TableRowCheckAlert v-model:checked-row-keys="checkedRowKeys" />
    <NCard :title="$t('page.system.user.title')" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          :show-add="hasAuth('system:user:add')"
          :show-delete="hasAuth('system:user:remove')"
          :show-export="hasAuth('system:user:export')"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        >
          <template #after></template>
        </TableHeaderOperation>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.userId"
        :pagination="mobilePagination"
        class="h-full"
        @update:sorter="handleSortChange"
      />
      <UserOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        :dept-data="deptData"
        :dept-id="searchParams.params?.deptId"
        @submitted="getDataByPage"
      />
      <UserPasswordDrawer v-model:visible="passwordVisible" :row-data="editingData" />
    </NCard>
  </div>
</template>

<style scoped lang="scss">
:deep(.n-data-table-wrapper),
:deep(.n-data-table-base-table),
:deep(.n-data-table-base-table-body) {
  height: 100%;
}

@media screen and (max-width: 800px) {
  :deep(.n-data-table-base-table-body) {
    max-height: calc(100vh - 400px - var(--calc-footer-height, 0px));
  }
}

@media screen and (max-width: 802px) {
  :deep(.n-data-table-base-table-body) {
    max-height: calc(100vh - 473px - var(--calc-footer-height, 0px));
  }
}

:deep(.n-card-header__main) {
  min-width: 69px !important;
}
</style>
