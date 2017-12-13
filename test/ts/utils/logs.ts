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
