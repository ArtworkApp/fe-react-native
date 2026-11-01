import { useAuthFormWorkflow, type AuthFormWorkflowOptions } from '../auth/useAuthFormWorkflow';
import { AuthFormView } from './AuthFormView';

function renderAuthFormView(
  options: AuthFormWorkflowOptions,
  workflow: ReturnType<typeof useAuthFormWorkflow>,
) {
  return <AuthFormView mode={options.mode} workflow={workflow} />;
}

export function AuthForm(options: AuthFormWorkflowOptions) {
  const workflow = useAuthFormWorkflow(options);
  return renderAuthFormView(options, workflow);
}
