import type { ComponentPropsWithoutRef } from 'react';
import * as Styles from './styles';
import type { ButtonVariant } from './styles';

type Props = ComponentPropsWithoutRef<'button'> & {
	variant?: ButtonVariant;
	small?: boolean;
};

const Button = ({ variant = 'primary', small = false, ...props }: Props) => (
	<Styles.StyledButton $variant={variant} $small={small} {...props} />
);

export default Button;
