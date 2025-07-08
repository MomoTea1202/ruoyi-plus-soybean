import { request } from '@/service/request';

/** 获取用户信息列表 */
export function fetchGetUserPermList(params?: Api.System.UsrPermSearchParams) {
  return request<Api.System.UsrPermList>({
    url: '/system/usrPerm/list',
    method: 'get',
    params
  });
}
