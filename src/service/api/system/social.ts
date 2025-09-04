import { request } from '../../request';

/** 解绑账户 */
export function fetchSocialAuthUnbinding(socialId: CommonType.IdType) {
  return request<string>({
    url: `/auth/unlock/${socialId}`,
    method: 'delete'
  });
}

/** 查询社会化关系列表 */
export function fetchSocialList() {
  return request<Api.System.Social[]>({
    url: '/system/social/list',
    method: 'get'
  });
}
