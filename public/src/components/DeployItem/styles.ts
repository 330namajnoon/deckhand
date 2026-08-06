import styled from "styled-components";

export const Item = styled.li`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.9rem 1.1rem;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
`;

export const ItemInfo = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
	min-width: 0;
`;

export const ItemTitle = styled.span`
	font-weight: 600;
`;

export const ItemMeta = styled.span`
	font-size: 0.85rem;
	color: #6b7280;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const ItemError = styled(ItemMeta)`
	color: #b91c1c;
`;

export const ItemActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex-shrink: 0;
`;
