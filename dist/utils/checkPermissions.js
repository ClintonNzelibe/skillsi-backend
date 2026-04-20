import { UnAuthenticatedError } from '../errors/index.js';
const checkPermissions = (requestAdmin, resourceAdminId) => {
    if (requestAdmin.role === 'admin')
        return;
    if (requestAdmin.adminId === resourceAdminId.toString())
        return;
    throw new UnAuthenticatedError('Not authorized to access this route');
};
export default checkPermissions;
