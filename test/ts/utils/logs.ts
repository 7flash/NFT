import {
    Address,
    Log,
    UInt,
} from "../../../types/contracts";

export function LogTransfer(
    from: Address,
    to: Address,
    tokenId: UInt,
): Log {
    return {
        args: {
            _from: from,
            _to: to,
            _tokenId: tokenId,
        },
        event: "Transfer",
    };
}

export function LogApproval(
    owner: Address,
    approved: Address,
    tokenId: UInt,
): Log {
    return {
        args: {
            _owner: owner,
            _approved: approved,
            _tokenId: tokenId,
        },
        event: "Approval",
    };
}
