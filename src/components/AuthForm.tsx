import { useAuthFormWorkflow, type AuthFormWorkflowOptions } from '../auth/useAuthFormWorkflow';
import { AuthFormView } from './AuthFormView';

export function AuthForm(options: AuthFormWorkflowOptions & { sessionWarning?: string }) {
  const workflow = useAuthFormWorkflow(options);
  return <AuthFormView mode={options.mode} workflow={workflow} sessionWarning={options.sessionWarning} />;
}
