import styled from "styled-components";

export const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1.5rem;
`;

export const Field = styled.label`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	font-weight: 600;
`;

export const Input = styled.input`
	padding: 0.5rem 0.75rem;
	font-size: 1rem;
	border: 1px solid #ccc;
	border-radius: 6px;
`;

export const Select = styled.select`
	padding: 0.5rem 0.75rem;
	font-size: 1rem;
	border: 1px solid #ccc;
	border-radius: 6px;
	background: white;
	color: #111827;
	color-scheme: light;
`;

export const CheckboxField = styled.label`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	cursor: pointer;

	input {
		width: 1.1rem;
		height: 1.1rem;
		cursor: pointer;
	}
`;
